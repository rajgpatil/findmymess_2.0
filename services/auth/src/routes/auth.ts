import express from "express";
import { addUserRole, loginUser, myProfile } from "../controllers/auth";
import { isAuth } from "../middlewares/isAuth";

const router = express.Router();

router.post("/login", loginUser);
router.put("/add/role", isAuth, addUserRole);
router.get("/me", isAuth, myProfile);

export default router;
