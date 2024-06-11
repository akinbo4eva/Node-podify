import { isValidObjectId } from "mongoose";
import * as yup from "yup";

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
