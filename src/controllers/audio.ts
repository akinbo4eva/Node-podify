import cloudinary from "#/cloud";
import { RequestWithFiles } from "#/middleware/fileParser";
import { categoriesTypes } from "#/utils/audio_category";
import { RequestHandler } from "express";
import formidable from "formidable";
import Audio from "#/models/audio";

interface CreateAudioRequest extends RequestWithFiles {
  body: {
    title: string;
    about: string;
    category: categoriesTypes;
  };
}

export const createAudio: RequestHandler = async (
  req: CreateAudioRequest,
  res
) => {
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File;
  const audioFile = req.files?.file as formidable.File;
  const ownerId = req.user.id;

  if (!audioFile)
    return res.status(422).json({ error: "Adio file is missing" });

  const audioRes = await cloudinary.uploader.upload(audioFile.filepath, {
    resource_type: "video",
  });

  // We are not using create method here is because the poster is optional and might be updated later
  const newAudio = new Audio({
    title,
    about,
    category,
    owner: ownerId,
    file: { url: audioRes.url, publicId: audioRes.public_id },
  });

  if (poster) {
    const posterRes = await cloudinary.uploader.upload(poster.filepath, {
      width: 300,
      height: 300,
      crop: "thumb",
      gravity: "face",
    });

    newAudio.poster = { url: posterRes.url, publicId: posterRes.public_id };
  }

  await newAudio.save();

  res.status(201).json({
    audio: {
      title,
      about,
      file: newAudio.file.url,
      poster: newAudio.poster?.url,
      category,
    },
  });
};
export const updateAudio: RequestHandler = async (
  req: CreateAudioRequest,
  res
) => {
    // we destructure what we want from the body of request
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File;
  const ownerId = req.user.id;
//   audio id is comming from request params
  const { audioId } = req.params;

//   here we find the audio using the findandupdate method and then update it along with other properties and rturn the "new: true"
  const audio = await Audio.findOneAndUpdate(
    { owner: ownerId, _id: audioId },
    { title, about, category },
    { new: true }
  );
 
//   if there is no audio or a mismatch
  if (!audio) return res.status(404).json({ error: "Record not found!" });

//   To update poster 
// check if there is poster to update
  if (poster) {
    // remvove the poster if there is an existing poster
    if (audio.poster?.publicId) {
      await cloudinary.uploader.destroy(audio.poster.publicId);
    }

    // after removing poster we then upload the new one to the cloud
    const posterRes = await cloudinary.uploader.upload(poster.filepath, {
      width: 300,
      height: 300,
      crop: "thumb",
      gravity: "face",
    });

    // update the value in the audio.poster to point to the updated cloud values
    audio.poster = { url: posterRes.url, publicId: posterRes.public_id };
  }
// after everythin, save the audio/poster update into the database again 
  await audio.save();

//   here is the response to the frontend
  res.status(201).json({
    audio: {
      title,
      about,
      file: audio.file.url,
      poster: audio.poster?.url,
      category,
    },
  });
};
