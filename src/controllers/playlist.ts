import {
  CreatePlaylistRequest,
  PopulateFavList,
  UpdatePlaylistRequest,
} from "#/@types/audio";
import Audio from "#/models/audio";
import Playlist from "#/models/playlist";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { title } from "process";

export const createPlaylist: RequestHandler = async (
  req: CreatePlaylistRequest,
  res
) => {
  const { title, resId, visibility } = req.body;
  const ownerId = req.user.id;

  //  while creating playlist ther can be request
  // or user just want to create an empty playlist
  // with new playlist name and the audio that the user wants to store inside that playlist

  if (resId) {
    //check if audio is in database or not
    const audio = await Audio.findById(resId);
    if (!audio)
      // if not throw error
      return res.status(404).json({ error: "Could not found the audio!" });
  }
  // we create a new playlist
  // we are not using create method because we intend to update the playlist if need be
  const newPlaylist = new Playlist({
    title,
    owner: ownerId,
    visibility,
  });

  //   if there is resId/audioId, we want to add audioId into items of the new playlist
  if (resId) newPlaylist.items = [resId as any];
  await newPlaylist.save();

  res.status(201).json({
    playlist: {
      id: newPlaylist._id,
      title: newPlaylist.title,
      visibility: newPlaylist.visibility,
    },
  });
};

export const updatePlaylist: RequestHandler = async (
  req: UpdatePlaylistRequest,
  res
) => {
  const { id, title, item, visibility } = req.body;

  const playlist = await Playlist.findOneAndUpdate(
    // if we find these with condition(audio id and owner id) below update the title and visibility
    { _id: id, owner: req.user.id },
    { title, visibility },
    { new: true }
  );

  //  if null
  if (!playlist) return res.status(404).json({ error: "Playlist not found!" });

  // proceed to see if we have the item coming from the body
  if (item) {
    // check if audio with given id(item) is present
    const audio = await Audio.findById(item);
    // throw error if not vailable
    if (!audio) return res.status(404).json({ error: "Audio not found!" });
    // if available add to the playlist
    // save afterwards

    await Playlist.findByIdAndUpdate(playlist._id, {
      $addToSet: { items: item },
    });
  }
  res.status(201).json({
    playlist: {
      id: playlist._id,
      title: playlist.title,
      visibility: playlist.visibility,
    },
  });
};

export const removePlaylist: RequestHandler = async (req, res) => {
  const { playlistId, resId, all } = req.query;
  // this logic is to remove the entire playlist
  if (!isValidObjectId(playlistId))
    return res.status(422).json({ error: "Invalid Playlist id!" });

  if (all === "yes") {
    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
      owner: req.user.id,
    });
    if (!playlist)
      return res.status(404).json({ error: "Playlist not found!" });
  }
  // this below logic is to remove a single audio from the playlist
  if (resId) {
    if (!isValidObjectId(resId))
      return res.status(422).json({ error: "Invalid Audio id!" });
    const playlist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user.id,
      },
      { $pull: { items: resId } }
    );

    if (!playlist)
      return res.status(404).json({ error: "Playlist not found!" });
  }

  res.json({ success: true });
};
export const getPlaylistByProfile: RequestHandler = async (req, res) => {
  const { pageNo = "0", limit = "20" } = req.query as {
    pageNo: string;
    limit: string;
  };

  const data = await Playlist.find({
    owner: req.user.id,
    visibility: { $ne: "auto" },
  })
    // skip from this number
    .skip(parseInt(pageNo) * parseInt(limit))
    //  start fro
    .limit(parseInt(limit))
    .sort("-createdAt");

  const playlist = data.map((item) => {
    return {
      id: item._id,
      title: item.title,
      itemsCount: item.items.length,
      visibility: item.visibility,
    };
  });

  res.json({ playlist });
};
export const getAudios: RequestHandler = async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    return res.status(422).json({ error: "Invalid playlist id!" });

  const playlist = await Playlist.findOne({
    owner: req.user.id,
    _id: playlistId,
  }).populate<{ items: PopulateFavList[] }>({
    path: "items",
    populate: { path: "owner", select: "name" },
  });

  if (!playlist) return res.json({ list: [] });
  const audios = playlist.items.map((item) => {
    return {
      id: item._id,
      title: item.title,
      category: item.category,
      file: item.file.url,
      poster: item.poster?.url,
      owner: { name: item.owner.name, id: item.owner._id },
    };
  });

  res.json({
    list: {
      id: playlist._id,
      title: playlist?.title,
      audios,
    },
  });
};
