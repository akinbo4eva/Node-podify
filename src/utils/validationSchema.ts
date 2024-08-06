import { isValidObjectId } from "mongoose";
import * as yup from "yup";
import { categories } from "./audio_category";

export const CreateUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Name is missing")
    .min(3, "Name is too short!")
    .max(20, "Name is too long"),
  email: yup
    .string()
    .required("Email is missing!")
    .email("Invalid email address!"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short")
    .matches(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
      "Password is too simple!"
    ),
});

export const TokenAndIdValidation = yup.object().shape({
  // validate the token
  token: yup.string().trim().required("Invalid token!"),
  // custom validation for objects Id
  userId: yup
    .string()
    // the transform method gives us the "value" which will be made available from the frontend
    .transform(function (value) {
      // if the type and the valid object id are true proceed to return the actual "value"
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      // if not valid we change it to an empty string, as this will trigger required method to throw an error
      return "";
    })
    .required("Invalid userId!"),
});

export const UpdatePasswordSchema = yup.object().shape({
  // validate the token
  token: yup.string().trim().required("Invalid token!"),
  // custom validation for objects Id
  userId: yup
    .string()
    // the transform method gives us the "value" which will be made available from the frontend
    .transform(function (value) {
      // if the type and the valid object id are true proceed to return the actual "value"
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      // if not valid we change it to an empty string, as this will trigger required method to throw an error
      return "";
    })
    .required("Invalid userId!"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short")
    .matches(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
      "Password is too simple!"
    ),
});

export const SignInValidationSchema = yup.object().shape({
  email: yup.string().required("Email is missing").email("Invalid email Id"),
  password: yup.string().trim().required("Password is missing!"),
});

export const AudioValidationSchema = yup.object().shape({
  title: yup.string().required("Title is missing"),
  about: yup.string().required("About is missing"),
  category: yup
    .string()
    .oneOf(categories, "Invalid category!")
    .required("Category is missing"),
});

export const NewPlaylistValidationSchema = yup.object().shape({
  title: yup.string().required("Title is missing"),
  resId: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  visibility: yup
    .string()
    .oneOf(["public", "private"], "Visibility must be public or private!")
    .required("Visibility is missing"),
});
export const OldPlaylistValidationSchema = yup.object().shape({
  title: yup.string().required("Title is missing"),
  // this is going to validate the audio id
  item: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  // this is going to validate the playlist id
  id: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  visibility: yup
    .string()
    .oneOf(["public", "private"], "Visibility must be public or private!"),
  // .required("Visibility is missing"),
});


export const UpdateHistorySchema = yup.object().shape({
  audio: yup
    .string()
    .transform(function (value) {
      return this.isType(value) && isValidObjectId(value) ? value : "";
    })
    .required("Invalid audio Id"),
  progress: yup.number().required("History progress is missing!"),
  date: yup
    .string()
    .transform(function (value) {
      const date = new Date(value);
      if (date instanceof Date) return value;
      return "";
    })
    .required("Invalid date!"),
});
