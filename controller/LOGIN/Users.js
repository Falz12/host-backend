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
  const { id } = req.params;

  try {
    // Verifikasi pengguna
    if (req.session.userId !== id) {
      return res.status(403).json({ msg: "Akses ditolak" });
    }

    const user = await User.findOne({
      attributes: ["uuid", "completedLessons"],
      where: { uuid: id },
    });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    const completedLessons = user.completedLessons || [];

    // Daftar materi sesuai daftarBab.json
    const daftarBab = [
      {
        id: 1,
        judul: "Pendahuluan",
        icon: "pendahuluanIcon",
        subBab: [
          { path: "/materi/bab1/pengenalan", label: "Pengenalan" },

          { path: "/materi/bab1/struktur-kode", label: "Struktur Kode" },
          {
            path: "/materi/bab1/struktur-eksekusi",
            label: "Struktur Eksekusi",
          },
          { path: "/materi/bab1/sintaks-print", label: "Sintaks Print" },
          { path: "/materi/bab1/sintaks-komentar", label: "Sintaks Komentar" },
          { path: "/materi/bab1/error-csharp", label: "Error C#" },
          { path: "/materi/bab1/latihan-bab1", label: "Latihan Bab 1" },
          { path: "/materi/bab1/kuis-bab1", label: "Kuis Bab 1" },
          { path: "/materi/bab1/rangkuman-bab1", label: "Rangkuman Bab 1" },
        ],
      },
      {
        id: 2,
        judul: "Variabel",
        icon: "variabelIcon",
        subBab: [
          { path: "/materi/bab2/variabel", label: "Variabel" },
          {
            path: "/materi/bab2/penamaan-variabel",
            label: "Penamaan Variabel",
          },
          {
            path: "/materi/bab2/kategori-variabel",
            label: "Kategori Variabel",
          },
          {
            path: "/materi/bab2/deklarasi-inialisasi",
            label: "Deklarasi dan Inialisasi",
          },
          {
            path: "/materi/bab2/deklarasi-banyak",
            label: "Deklarasi Banyak Variabel",
          },
          {
            path: "/materi/bab2/variabel-konstanta",
            label: "Variabel dan Konstanta",
          },
          { path: "/materi/bab2/sintaks-input", label: "Sintaks Input" },
          { path: "/materi/bab2/latihan-bab2", label: "Latihan Bab 2" },
          { path: "/materi/bab2/kuis-bab2", label: "Kuis Bab 2" },
          { path: "/materi/bab2/rangkuman-bab2", label: "Rangkuman Bab 2" },
        ],
      },
      {
        id: 3,
        judul: "Tipe Data",
        icon: "tipeDataIcon",
        subBab: [
          {
            path: "/materi/bab3/pengertian-tipedata",
            label: "Pengertian Tipe Data",
          },
          {
            path: "/materi/bab3/klasifikasi-tipedata",
            label: "Klasifikasi Tipe Data",
          },
          { path: "/materi/bab3/tipe-data-dasar", label: "Tipe Data Dasar" },
          { path: "/materi/bab3/integer", label: "Integer" },
          { path: "/materi/bab3/floating-point", label: "Floating Point" },
          { path: "/materi/bab3/boolean", label: "Boolean" },
          { path: "/materi/bab3/char", label: "Char" },
          { path: "/materi/bab3/string", label: "String" },
          { path: "/materi/bab3/latihan-bab3", label: "Latihan Bab 3" },
          { path: "/materi/bab3/kuis-bab3", label: "Kuis Bab 3" },
          { path: "/materi/bab3/rangkuman-bab3", label: "Rangkuman Bab 3" },
        ],
      },
      {
        id: 4,
        judul: "Operator",
        icon: "operatorIcon",
        subBab: [
          {
            path: "/materi/bab4/pengertian-operator",
            label: "Pengertian Operator",
          },
          {
            path: "/materi/bab4/operator-arithmetic",
            label: "Operator Aritmatika",
          },
          {
            path: "/materi/bab4/operator-increment-decrement",
            label: "Operator Increment dan Decrement",
          },
          {
            path: "/materi/bab4/operator-assignment",
            label: "Operator Assignment",
          },
          {
            path: "/materi/bab4/operator-comparison",
            label: "Operator Perbandingan",
          },
          { path: "/materi/bab4/operator-logika", label: "Operator Logika" },
          {
            path: "/materi/bab4/operator-conditional",
            label: "Operator Kondisional",
          },
          {
            path: "/materi/bab4/operator-equality",
            label: "Operator Equality",
          },
          { path: "/materi/bab4/latihan-bab4", label: "Latihan Bab 4" },
          { path: "/materi/bab4/kuis-bab4", label: "Kuis Bab 4" },
          { path: "/materi/bab4/rangkuman-bab4", label: "Rangkuman Bab 4" },
        ],
      },
      {
        id: 5,
        judul: "Kontrol Alur",
        icon: "kontrolAlurIcon",
        subBab: [
          {
            path: "/materi/bab5/pengertian-kontrol-alur",
            label: "Pengertian Kontrol Alur",
          },
          {
            path: "/materi/bab5/pernyataan-if-else",
            label: "Pernyataan If-Else",
          },
          {
            path: "/materi/bab5/pernyataan-switch",
            label: "Pernyataan Switch",
          },
          {
            path: "/materi/bab5/pernyataan-perulangan",
            label: "Pernyataan Perulangan",
          },
          {
            path: "/materi/bab5/pernyataan-break-continue",
            label: "Pernyataan Break dan Continue",
          },
          {
            path: "/materi/bab5/perulangan-bersarang",
            label: "Perulangan Bersarang",
          },
          { path: "/materi/bab5/latihan-bab5", label: "Latihan Bab 5" },
          { path: "/materi/bab5/kuis-bab5", label: "Kuis Bab 5" },
          { path: "/materi/bab5/rangkuman-bab5", label: "Rangkuman Bab 5" },
        ],
      },
      {
        id: 6,
        judul: "Method",
        icon: "methodIcon",
        subBab: [
          {
            path: "/materi/bab6/pengenalan-method",
            label: "Pengenalan Method",
          },
          { path: "/materi/bab6/method-void", label: "Method Void" },
          {
            path: "/materi/bab6/method-tipe-data",
            label: "Method dengan Tipe Data",
          },
          { path: "/materi/bab6/parameter-method", label: "Parameter Method" },
          { path: "/materi/bab6/latihan-bab6", label: "Latihan Bab 6" },
          { path: "/materi/bab6/kuis-bab6", label: "Kuis Bab 6" },
          { path: "/materi/bab6/rangkuman-bab6", label: "Rangkuman Bab 6" },
        ],
      },
      {
        id: 7,
        judul: "Evaluasi",
        icon: "evaluasi",
        subBab: [
          { path: "/materi/evaluasi/evaluasi-akhir", label: "Evaluasi Akhir" },
        ],
      },
    ];

    const allLessons = daftarBab.flatMap((bab) =>
      bab.subBab.map((sub) => sub.path)
    );
    const lessonIndex = allLessons.indexOf(lessonPath);

    if (lessonIndex === -1) {
      return res.status(400).json({ msg: "Materi tidak valid" });
    }

    const isAccessible =
      completedLessons.includes(lessonPath) ||
      lessonIndex === 0 ||
      (lessonIndex > 0 &&
        completedLessons.includes(allLessons[lessonIndex - 1]));

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
