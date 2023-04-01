# axis-data-conversion
This node app migrates the data from the MSSQL Axis database into a new MySQL axis database.


## 🔵 Tolmann server initial setup
In the server, create a folder (if not exists) called `webserver`

Install *git* from https://git-scm.com/ by clicking on the Download for Windows button inside the  image with a computer monitor and current stable version number.

Execute GitBash from the installed app

You will be located at the user data folder, so change to drive C: by typing:

```bash cd /c/ ``` <img src="https://user-images.githubusercontent.com/7883563/229307701-856d3385-c753-45de-9a53-c52bdee597a5.png" height="20" />


After that, just type

```bash mkdir webserver ``` <img src="https://user-images.githubusercontent.com/7883563/229307701-856d3385-c753-45de-9a53-c52bdee597a5.png" height="20" />

This command will create (if not exists) the folder *webserver* in *C:* drive

If the folder already exists you should get the following message:

```bash mkdir: cannot create directoary 'webserver':: File exists ```

You have now to move inside that directory by doing:

```bash cd webserver ``` <img src="https://user-images.githubusercontent.com/7883563/229307701-856d3385-c753-45de-9a53-c52bdee597a5.png" height="20" />

Now you have to clone the GitHub repository by runing the following command:

```bash git clone https://github.com/omelendrez/axis-data-conversion.git ``` <img src="https://user-images.githubusercontent.com/7883563/229307701-856d3385-c753-45de-9a53-c52bdee597a5.png" height="20" />

Now you have to move inside the new folder created by the clone action as follows:

```bash cd axis-data-conversion ``` <img src="https://user-images.githubusercontent.com/7883563/229307701-856d3385-c753-45de-9a53-c52bdee597a5.png" height="20" />
