# axis-data-conversion
This node app migrates the data from the MSSQL Axis database into a new MySQL axis database.

---
## 🔵 Tolmann - Server setup

You should have MySQL Server 8.0 Community version installed in the server.

If MySQL is not installed you should install it from https://dev.mysql.com/downloads/windows/installer/8.0.html

You should have Nodejs version 16 or higher installed in the server.

If Nodejs is not installed you should install version 18.15.0 from https://nodejs.org/en

---

## 🔵 Clonning and installing the app

Install **Git** from https://git-scm.com/ by clicking on the Download for Windows button inside the  image with a computer monitor and current stable version number. You will need git to perform several activities, mainly by using **Git Bash**.

Once installe, run **Git Bash** in order to open the *bash terminal*. (To find Git Bash app just click on Start icon in Windows machine and type **git bash**.)

Here is where you are going to perform the app setup and run it.

You will need to have a folder called **webserver** in drive **C:**.

**Tip:** *Always press Enter after each command you are requested to type.*

In order to do that, change to drive **C:** by typing:

```bash
cd /c/
```

After that, just type

```bash
mkdir webserver
```

This command will create (if not exists) the folder **webserver** in **C:** drive

If the folder already exists you should get the following error message:

```bash
mkdir: cannot create directoary 'webserver':: File exists
```
Don't worry if you got the message. This is expected and nothing wrong will happen to the process.


You have now to move inside that directory by doing:

```bash
cd webserver
```

Now you have to clone the GitHub repository by runing the following command:

```bash
git clone https://github.com/omelendrez/axis-data-conversion.git
```

Now you have to move inside the new folder created by the clone action as follows:

```bash
cd axis-data-conversion
```

You should run now:

```bash
npm ci
```

This command line will install all the app dependencies.

You will find a file called `.env.example` in that folder.

You have to copy that file in the same folder with a different name. Just name it `.env`

Now you have to edit that `.env` file and check the content.

```bash
MSSQL_USER="sa"
MSSQL_PASSWORD="password"
MSSQL_SERVER="localhost"
MSSQL_DATABASE="Axis"

MYSQL_USER="root"
MYSQL_PASSWORD="password"
MYSQL_SERVER="localhost"
```

Now you need to set the actual user, password and database values.

The values starting with `MSSQL` correspond to the **Axis** SQL Server database already installed in the server and that will be the source of our data conversion.

The values starting with `MYSQL` correspon to the **axis** MySQL database we want to create with the data coming from SQL Server Axis.

You can request to me those credentials.

Once the file has been created and the right credentials have been updated in this file, you can run the data conversion by typing:

```bash
npm start
```
The app will show in the terminal the process step by step.
If everything concludes without errors, you should see the last message as follows:

![Screenshot 2023-04-16 120631](https://user-images.githubusercontent.com/7883563/232322085-7a763c9f-b128-46af-9fef-e545b4fcdadd.png)

If this is the case, the new version of axis database has already been migrated to MySQL server.
