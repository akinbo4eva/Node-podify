import { categories, categoriesTypes } from "#/utils/audio_category";
import { Model, ObjectId, Schema, model, models } from "mongoose";

export interface AudioDocument<T = ObjectId> {
  _id: ObjectId;
  title: string;
  about: string;
  owner: T;
  file: {
    url: string;
    publicId: string;
  };

  poster?: {
    url: string;
    publicId: string;
  };

  likes: ObjectId[];
  category: categoriesTypes;
  createdAt: Date;
}

const AudioSchema = new Schema<AudioDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      // the below user is coming from "user.ts => model name"
      ref: "User",
    },
    file: {
      type: Object,
      url: String,
      publicId: String,
      required: true,
    },
    poster: {
      type: Object,
      url: String,
      publicId: String,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        // the below user is coming from "user.ts => model name"
        ref: "User",
      },
    ],
    category: {
      type: String,
      enum: categories,
      default: "Others",
    },
  },
  { timestamps: true }
);

const Audio = models.Audio || model("Audio", AudioSchema);
export default Audio as Model<AudioDocument>;

// or simply use below for export instead of the two lines above

// export default model("Audio", AudioSchema) as Model<AudioDocument>;
