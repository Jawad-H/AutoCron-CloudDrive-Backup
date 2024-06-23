require("dotenv").config();
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs").promises;
const express = require("express");
const schedule = require("node-schedule");

const {
  REDIRECT_URI,
  REFRESH_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET,
  DAILY_FOLDER,
  KEYCLOAK_DIRECTORY,
} = process.env;

const app = express();

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

const folderPath = process.cwd();
const dailyFolderPath = path.join(folderPath, DAILY_FOLDER);

schedule.scheduleJob("30 14 * * *", dailyBackup);

schedule.scheduleJob("30 14 * * 0", keycloakBackup);

async function dailyBackup() {
  try {
    const folderId = await createFolder("Backup");
    const subfolders = await fs.readdir(dailyFolderPath, {
      withFileTypes: true,
    });

    for (const subfolder of subfolders) {
      if (subfolder.isDirectory()) {
        const subfolderPath = path.join(dailyFolderPath, subfolder.name);
        await uploadFolderContents(subfolderPath, folderId);
      }
    }
    console.log("Daily backup completed successfully");
  } catch (error) {
    console.error("Error in daily backup:", error);
  }
}

async function keycloakBackup() {
  try {
    const folderId = await createFolder("KeyCloakBackup");
    await uploadFolderContents(KEYCLOAK_DIRECTORY, folderId, true);
    console.log("KeyCloak backup completed successfully");
  } catch (error) {
    console.error("Error in KeyCloak backup:", error);
  }
}

async function uploadFolderContents(
  folderPath,
  driveFolderId,
  isKeycloak = false
) {
  const files = await fs.readdir(folderPath);
  const currentDate = new Date().toISOString().split("T")[0];
  const dateRegex = new RegExp(currentDate.replace(/-/g, "\\-"), "g");

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = await fs.stat(filePath);

    if (
      stat.isFile() &&
      (isKeycloak
        ? path.extname(file).toLowerCase() === ".json"
        : file.endsWith(".gz") && dateRegex.test(file))
    ) {
      await uploadFile(file, filePath, driveFolderId);
      if (isKeycloak) {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }
  }
}

async function uploadFile(fileName, filePath, folderId) {
  try {
    const mimeType = fileName.endsWith(".gz")
      ? "application/gz"
      : "application/json";
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: fs.createReadStream(filePath),
      },
    });
    console.log(`Uploaded file: ${fileName}`);
    return response.data;
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, error.message);
  }
}

async function createFolder(baseName) {
  const folderName = `${baseName}-${new Date().toISOString().split("T")[0]}`;
  try {
    const file = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    console.log(`Created folder: ${folderName}`);
    return file.data.id;
  } catch (error) {
    console.error(`Error creating folder ${folderName}:`, error);
    throw error;
  }
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
