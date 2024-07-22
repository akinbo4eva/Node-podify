import { PopulateFavList } from "#/@types/audio";
import Audio from "#/models/audio";
import Favorite from "#/models/favorite";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export const toggleFavorite: RequestHandler = async (req, res) => {
  // get the audio id from query
  const audioId = req.query.audioId as string;

  let status: "added" | "removed";

  //   validate if the id is valid or not
  if (!isValidObjectId(audioId))
    return res.status(422).json({ error: "Audio Id is invalid!" });

  //   check if the audio is in the database or not
  const audio = await Audio.findById(audioId);
  //   throw error if audio not found
  if (!audio) return res.status(404).json({ error: "Resources not found!" });

  // if audio is found we proceed to the following senerios

  // audio is already in fav
  const alreadyExists = await Favorite.findOne({
    // we find the one with the user "id" and "audioId" and if exist store the value in "alreadyExists"
    owner: req.user.id,
    items: audioId,
  });
  if (alreadyExists) {
    // we want to remove from fav old list
    await Favorite.updateOne(
      { owner: req.user.id },
      {
        $pull: { items: audioId },
      }
    );
    status = "removed";
  } else {
    // if ther is no audioId in the first condition we proceed to this block
    const favorite = await Favorite.findOne({ owner: req.user.id });
    if (favorite) {
      // trying to create new fav list by adding the audioId i.e a Favorite list exist and with the user
      await Favorite.updateOne(
        { owner: req.user.id },
        {
          // this does not allow duplicate value
          $addToSet: { items: audioId },
        }
      );
    } else {
      // trying to create a fresh fav list by adding ownerId and audioId
      await Favorite.create({ owner: req.user.id, items: [audioId] });
    }
    status = "added";
  }
  if (status === "added") {
    await Audio.findByIdAndUpdate(audioId, {
      $addToSet: { likes: req.user.id },
    });
  }
  if (status === "removed") {
    await Audio.findByIdAndUpdate(audioId, {
      $pull: { likes: req.user.id },
    });
  }
  res.json({ status });
};

export const getFavorites: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  const favorite = await Favorite.findOne({ owner: userId }).populate<{
    items: PopulateFavList[];
  }>({
    path: "items",
    populate: {
      path: "owner",
    },
  });

  if (!favorite) return res.json({ audios: [] });

  const audios = favorite.items.map((item) => {
    return {
      id: item._id,
      title: item.title,
      category: item.category,
      file: item.file.url,
      poster: item.poster?.url,
      owner: { name: item.owner.name, id: item.owner._id },
    };
  });
  res.json({ audios });
};

export const getIsFavorites: RequestHandler = async (req, res) => {
    // get the id
  const audioId = req.query.audioId as string;

// verify if its the valid objectId
  if (!isValidObjectId(audioId))
    return res.status(422).json({ error: "Invalid audio Id!" });

//   if ObbjectId is verified, proceed to find the particular one favirite list tha consist the objects passed in
  const favorite = await Favorite.findOne({
    owner: req.user.id,
    items: audioId,
  });
//   the favorite return the document/fav list or null
  res.json({ result: favorite ? true : false });
};
