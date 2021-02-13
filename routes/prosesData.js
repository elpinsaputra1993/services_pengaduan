let express = require("express"),
  multer = require("multer"),
  mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const DIR = "./public/";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, uuidv4() + "-" + fileName);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

let User = require("../models/User");
let Proses = require("../models/Proses_pelaporan");

module.exports = (app) => {
  app.post(
    "/api/upload-images",
    upload.array("imgCollection", 6),
    (req, res, next) => {
      // datas = { body: req.body, files: req.files };
      // console.log("request now  >> " + datas);
      console.log(`Req files ` + JSON.stringify(req.files));
      console.log(`Req body ` + JSON.stringify(req.body));
      const reqFiles = [];
      const url = req.protocol + "://" + req.get("host");
      for (var i = 0; i < req.files.length; i++) {
        reqFiles.push(url + "/public/" + req.files[i].filename);
      }

      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        imgCollection: reqFiles,
        name: req.body.fname,
        phone: req.body.notelp,
        email: req.body.email,
        topic: req.body.topik,
        info: req.body.info,
      });

      user
        .save()
        .then((result) => {
          let lastDataUser = User.find({})
            .sort({ _id: -1 })
            .limit(1)
            .then((data) => {
              console.log(data[0]);
              // console.log(data[0]._id);

              const proses = new Proses({
                _id: new mongoose.Types.ObjectId(),
                id_pelapor: data[0]._id,
                name: data[0].name,
              });

              proses.save(function (err, result) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(result);
                }
              });
              // proses.save();
            });

          res.status(201).json({
            message: "Done upload!",
            userCreated: {
              _id: result._id,
              imgCollection: result.imgCollection,
            },
            files: req.files,
            body: req.body,
          });
        })
        .catch((err) => {
          console.log(err),
            res.status(500).json({
              error: err,
            });
        });
    }
  );
  // MySchema.find().sort({ createdAt: 1 }).limit(10); // oldest docs
  // MySchema.find().sort({ createdAt: -1 }).limit(10); // latest docs

  app.get("/api/pelapor", async (req, res) => {
    let dataHasil = await User.find();
    res.status(201).json({
      status: "success",
      dataLength: dataHasil.length,
      timestamp: req.requestTime,
      data: dataHasil,
    });
  });

  app.get("/api/pelapor/:idx", async (req, res, next) => {
    var id = req.params.idx;

    let dataHasil = await User.findById(id);
    res.status(201).json({
      status: "success",
      dataLength: dataHasil.length,
      timestamp: req.requestTime,
      data: dataHasil,
    });

    // User.find({ _id: mongoose.ObjectId(id) });
  });

  app.get("/api/tindaklanjut", async (req, res) => {
    let dataHasil = await Proses.find();
    res.status(201).json({
      status: "success",
      dataLength: dataHasil.length,
      timestamp: req.requestTime,
      data: dataHasil,
    });
  });
};
