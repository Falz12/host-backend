import User from "../../models/LOGIN/UserModel.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const getUsers = async (req, res) => {
  try {
    const { class: userClass } = req.query;
    const whereClause = { role: "user" };
    if (userClass) {
      whereClause.class = userClass;
    }
    const users = await User.findAll({
      attributes: [
        "uuid",
        "name",
        "nis",
        "role",
        "school",
        "class",
        "status",
        "progress",
        "completedLessons",
      ],
      where: whereClause,
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error di getUsers:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const getClasses = async (req, res) => {
  try {
    const classes = await User.findAll({
      attributes: ["class"],
      where: { role: "user" },
      group: ["class"],
      order: [["class", "ASC"]],
    });
    const classList = classes.map((item) => item.class).filter((cls) => cls);
    res.status(200).json(classList);
  } catch (error) {
    console.error("Error di getClasses:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const getUsersById = async (req, res) => {
  try {
    const user = await User.findOne({
      attributes: [
        "uuid",
        "name",
        "nis",
        "role",
        "school",
        "class",
        "status",
        "progress",
        "completedLessons",
      ],
      where: { uuid: req.params.id },
    });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error di getUsersById:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const createUsers = async (req, res) => {
  const {
    name,
    email,
    nis,
    password,
    role,
    school,
    class: userClass,
    status,
    progress,
    completedLessons,
  } = req.body;
  try {
    if (status && !["SELESAI", "BELUM SELESAI"].includes(status)) {
      return res
        .status(400)
        .json({ msg: "Status harus SELESAI atau BELUM SELESAI" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      uuid: uuidv4(),
      name,
      email,
      nis,
      password: hashedPassword,
      role,
      school,
      class: userClass,
      status: status || "BELUM SELESAI",
      progress: progress || 0,
      completedLessons: completedLessons || [],
    });
    res.status(201).json({ msg: "User berhasil dibuat" });
  } catch (error) {
    console.error("Error di createUsers:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

const updateUsers = async (req, res) => {
  const {
    name,
    email,
    nis,
    password,
    role,
    school,
    class: userClass,
    status,
    progress,
    completedLessons,
  } = req.body;
  try {
    const user = await User.findOne({ where: { uuid: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    if (status && !["SELESAI", "BELUM SELESAI"].includes(status)) {
      return res
        .status(400)
        .json({ msg: "Status harus SELESAI atau BELUM SELESAI" });
    }
    const updatedData = {
      name,
      email,
      nis,
      role,
      school,
      class: userClass,
      status: status || user.status,
      progress,
      completedLessons,
    };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }
    await User.update(updatedData, { where: { uuid: req.params.id } });
    res.status(200).json({ msg: "User berhasil diperbarui" });
  } catch (error) {
    console.error("Error di updateUsers:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

const delateUsers = async (req, res) => {
  try {
    const user = await User.findOne({ where: { uuid: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    await User.destroy({ where: { uuid: req.params.id } });
    res.status(200).json({ msg: "User berhasil dihapus" });
  } catch (error) {
    console.error("Error di delateUsers:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const updateProgress = async (req, res) => {
  const { progress, completedLessons } = req.body;
  try {
    const user = await User.findOne({ where: { uuid: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ msg: "Progress harus antara 0 dan 100" });
    }
    const status = progress === 100 ? "SELESAI" : "BELUM SELESAI";
    await User.update(
      { progress, status, completedLessons },
      { where: { uuid: req.params.id } }
    );
    res.status(200).json({ msg: "Progress dan status berhasil diperbarui" });
  } catch (error) {
    console.error("Error di updateProgress:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const validateLesson = async (req, res) => {
  const { lessonPath } = req.body;
  try {
    const user = await User.findOne({
      attributes: ["uuid", "completedLessons"],
      where: { uuid: req.params.id },
    });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    const completedLessons = user.completedLessons || [];
    // Define all lessons in order (this could be moved to a shared config)
    const allLessons = [
      "/materi/bab1/pengenalan",
      "/materi/bab1/instalasi",
      "/materi/bab1/struktur-kode",
      "/materi/bab1/struktur-eksekusi",
      "/materi/bab1/sintaks-print",
      "/materi/bab1/sintaks-komentar",
      "/materi/bab1/error-csharp",
      "/materi/bab1/latihan-bab1",
      "/materi/bab1/kuis-bab1",
      "/materi/bab1/rangkuman-bab1",
      "/materi/bab2/variabel",
      "/materi/bab2/penamaan-variabel",
      "/materi/bab2/kategori-variabel",
      "/materi/bab2/deklarasi-inialisasi",
      "/materi/bab2/deklarasi-banyak",
      "/materi/bab2/variabel-konstanta",
      "/materi/bab2/sintaks-input",
      "/materi/bab2/latihan-bab2",
      "/materi/bab2/kuis-bab2",
      "/materi/bab2/rangkuman-bab2",
      "/materi/bab3/pengertian-tipedata",
      "/materi/bab3/klasifikasi-tipedata",
      "/materi/bab3/tipe-data-dasar",
      "/materi/bab3/integer",
      "/materi/bab3/floating-point",
      "/materi/bab3/boolean",
      "/materi/bab3/char",
      "/materi/bab3/string",
      "/materi/bab3/latihan-bab3",
      "/materi/bab3/kuis-bab3",
      "/materi/bab3/rangkuman-bab3",
      "/materi/bab4/pengertian-operator",
      "/materi/bab4/operator-arithmetic",
      "/materi/bab4/operator-increment-decrement",
      "/materi/bab4/operator-assignment",
      "/materi/bab4/operator-comparison",
      "/materi/bab4/operator-logika",
      "/materi/bab4/operator-conditional",
      "/materi/bab4/operator-equality",
      "/materi/bab4/latihan-bab4",
      "/materi/bab4/kuis-bab4",
      "/materi/bab4/rangkuman-bab4",
      "/materi/bab5/pengertian-kontrol-alur",
      "/materi/bab5/pernyataan-if-else",
      "/materi/bab5/pernyataan-switch",
      "/materi/bab5/pernyataan-perulangan",
      "/materi/bab5/pernyataan-break-continue",
      "/materi/bab5/perulangan-bersarang",
      "/materi/bab5/latihan-bab5",
      "/materi/bab5/kuis-bab5",
      "/materi/bab5/rangkuman-bab5",
      "/materi/bab6/pengenalan-method",
      "/materi/bab6/method-void",
      "/materi/bab6/method-tipe-data",
      "/materi/bab6/parameter-method",
      "/materi/bab6/latihan-bab6",
      "/materi/bab6/kuis-bab6",
      "/materi/bab6/rangkuman-bab6",
      "/materi/evaluasi/evaluasi-akhir",
    ];
    const lessonIndex = allLessons.indexOf(lessonPath);
    if (lessonIndex === -1) {
      return res.status(400).json({ msg: "Materi tidak valid" });
    }
    // Allow access if the lesson is completed or is the next lesson
    const isAccessible =
      completedLessons.includes(lessonPath) ||
      (completedLessons.length > 0 &&
        allLessons[completedLessons.length] === lessonPath) ||
      (completedLessons.length === 0 && lessonIndex === 0);
    res.status(200).json({ isAccessible });
  } catch (error) {
    console.error("Error di validateLesson:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

export {
  getUsers,
  getClasses,
  getUsersById,
  createUsers,
  updateUsers,
  delateUsers,
  updateProgress,
  validateLesson,
};
