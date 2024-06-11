import fileParser from "#/middleware/fileParser";
import {
  create,
  generateForgetPasswordLink,
  grantValid,
  sendReVerificationToken,
  signIn,
  updatePassword,
  updateProfile,
  verifyEmail,
} from "#/controllers/user";
import { isValidPassResetToken, mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import {
  CreateUserSchema,
  SignInValidationSchema,
  TokenAndIdValidation,
  UpdatePasswordSchema,
} from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post("/create", validate(CreateUserSchema), create);
router.post("/verify-email", validate(TokenAndIdValidation), verifyEmail);
router.post("/re-verify-email", sendReVerificationToken);
router.post("/forget-password", generateForgetPasswordLink);
router.post(
  "/verify-pass-reset-token",
  validate(TokenAndIdValidation),
  isValidPassResetToken,
  grantValid
);
router.post(
  "/update-password",
  validate(UpdatePasswordSchema),
  isValidPassResetToken,
  updatePassword
);
router.post("/sign-in", validate(SignInValidationSchema), signIn);

router.get("/is-auth", mustAuth, (req, res) => {
  res.json({
    profile: req.user,
  });
});
router.get("/public", (req, res) => {
  res.json({
    message: "You are in public route",
  });
});
router.get("/private", mustAuth, (req, res) => {
  res.json({
    message: "You are in the private route",
  });
});

router.post("/update-profile", mustAuth, fileParser, updateProfile);
export default router;
