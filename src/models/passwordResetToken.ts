import { Model, ObjectId, Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";

interface PasswordResetTokenDocument {
  owner: ObjectId;
  token: string;
  createsAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

const passwordResetTokenSchema = new Schema<
  PasswordResetTokenDocument,
  {},
  Methods
>({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  createsAt: {
    type: Date,
    expires: 3600,
    default: Date.now(),
  },
});

// the method below will hash the token before it is saved
passwordResetTokenSchema.pre("save", async function (next) {
  //  Harsh the token
  if (this.isModified("token")) {
    this.token = await hash(this.token, 10);
  }
  next();
});

// The below method capares the hash token in database with one the user sends from
// their email which is the "token" passed as argument
passwordResetTokenSchema.methods.compareToken = async function (token) {
  // below unhash and compare token with the one already in the
  // database and returns a boolean
  const result = await compare(token, this.token);
  return result;
};

export default model("PasswordResetToken", passwordResetTokenSchema) as Model<
  PasswordResetTokenDocument,
  {},
  Methods
>;
