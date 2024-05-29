import { CreateUser } from "#/@types/user";
import { validate } from "#/middleware/validator";
import User from "#/models/user";
import { CreateUserSchema } from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post(
  "/create",
  validate(CreateUserSchema),
  (req: CreateUser, res, next) => {
    const { name, email, password } = req.body;
    CreateUserSchema.validate({ email, password, name }).catch((error) => {
      console.log(error);
    });
    if (!name.trim()) return res.json({ error: "Name is missing!" });
    if (name.length < 3) return res.json({ error: "Invalid name!" });
    next();
  },
  async (req: CreateUser, res) => {
    const { name, email, password } = req.body;
    //   const newUser = new User({ name, email, password });
    //   newUser.save();

    const user = await User.create({ name, email, password });
    res.json({ user });
  }
);

export default router;
