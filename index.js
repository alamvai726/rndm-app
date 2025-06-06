const express = require("express");
const multer = require("multer");
const axios = require("axios");
const dotenv = require("dotenv");
const db = require("./db");
const fs = require("fs");
const path = require("path");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/upload/:category", upload.single("video"), async (req, res) => {
  const filePath = req.file.path;
  const { category } = req.params;
  const uploader = req.body.uploader || "Anonymous";

  try {
    const data = fs.readFileSync(filePath, { encoding: "base64" });

    const imgurRes = await axios.post(
      "https://api.imgur.com/3/upload",
      { video: data, type: "base64" },
      {
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
        },
      }
    );

    const videoUrl = imgurRes.data.data.link;

    db.run(
      "INSERT INTO videos (category, url, uploader) VALUES (?, ?, ?)",
      [category.toLowerCase(), videoUrl, uploader],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          success: true,
          id: this.lastID,
          url: videoUrl,
          message: `Video uploaded under '${category}' by '${uploader}'`,
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to upload to Imgur", details: err.message });
  } finally {
    fs.unlinkSync(filePath);
  }
});

app.get("/random/:category", (req, res) => {
  const category = req.params.category.toLowerCase();

  db.all(
    "SELECT * FROM videos WHERE category = ?",
    [category],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.json({ message: "No videos found." });

      const random = rows[Math.floor(Math.random() * rows.length)];
      res.json({
        category,
        total: rows.length,
        randomVideo: random.url,
        uploadedBy: random.uploader,
      });
    }
  );
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
