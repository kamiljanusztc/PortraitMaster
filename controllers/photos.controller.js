const Photo = require('../models/photo.model');
const Voter = require("../models/Voter.model");
const requestIp = require("request-ip");

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const pattern = new RegExp(/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/, 'g');

    const titleMatched = title.match(pattern).join('');
    const authorMatched = author.match(pattern).join('');

    if(titleMatched.length < title.length 
      && authorMatched.length < author.length) 
      throw new Error('Invalid characters...');

    const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const validatedEmail = emailPattern.test(email);
    if(!validatedEmail) throw new Error('Invalid characters...');

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      const fileFormat = [ 'jpeg', 'jpg', 'png', 'gif'];
      if( fileFormat.includes(fileExt) && title.length <= 25 && author.length <= 50 ) {

        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    
    if (!photoToUpdate) res.status(404).json({ message: "Not found" });
    else {
      const voter = await Voter.findOne({ user: req.clientIp });
      if (!voter) {
        const newVoter = new Voter({ user: req.clientIp, votes: photoToUpdate._id });
        await newVoter.save();
      } else {
        if (voter.votes.includes(photoToUpdate._id)) {
          throw new Error('Vote duplicate!');
        } else {
          voter.votes.push(photoToUpdate._id);
          await voter.save();
        }
      }
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: "OK" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};



