import { ObjectId, Schema, Model, model, models } from "mongoose";

type historyType = { audio: ObjectId; progress: number; date: Date };

interface HistoryDocument {
  owner: ObjectId;
  last: historyType;
  all: historyType[];
}

const historySchema =  new Schema<HistoryDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    last: {
      audio: { type: Schema.Types.ObjectId, ref: "Audio" },
      require: true,
      progress: Number,
      date: {
        type: Date,
        required: true,
      },
    },
    all: [
      {
        audio: { type: Schema.Types.ObjectId, ref: "Audio" },
        require: true,
        progress: Number,
        date: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const History = models.History || model("History", historySchema);

export default History as Model<HistoryDocument>;
