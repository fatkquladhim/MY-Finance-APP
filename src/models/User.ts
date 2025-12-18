import { Schema, model, models } from "mongoose";
import { hash } from "bcrypt";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: String,
  avatar: String,
}, { timestamps: true });

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hash(this.password, 12);
});

export default models.User || model("User", UserSchema);