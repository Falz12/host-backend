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
        id: "bab1",
        judul: "PENDAHULUAN",
        icon: "pendahuluanIcon",
        subBab: [
          { path: "/materi/bab1/pengenalan", label: "1.1 Pengenalan C#" },
          {
            path: "/materi/bab1/struktur-kode",
            label: "1.2 Struktur Kode Bahasa Pemrograman C#",
          },
          {
            path: "/materi/bab1/struktur-eksekusi",
            label: "1.3 Struktur Eksekusi Kode",
          },
          { path: "/materi/bab1/sintaks-print", label: "1.4 Sintaks Print" },
          {
            path: "/materi/bab1/sintaks-komentar",
            label: "1.5 Sintaks Komentar",
          },
          { path: "/materi/bab1/error-csharp", label: "1.6 Error Pada C#" },
          { path: "/materi/bab1/latihan-bab1", label: "Latihan" },
          { path: "/materi/bab1/kuis-bab1", label: "KUIS" },
          { path: "/materi/bab1/rangkuman-bab1", label: "RANGKUMAN" },
        ],
      },
      {
        id: "bab2",
        judul: "VARIABEL",
        icon: "variabelIcon",
        subBab: [
          {
            path: "/materi/bab2/variabel",
            label: "2.1 Pengertian Variabel",
          },
          {
            path: "/materi/bab2/penamaan-variabel",
            label: "2.2 Penamaan Variabel",
          },
          {
            path: "/materi/bab2/kategori-variabel",
            label: "2.3 Kategori Variabel",
          },
          {
            path: "/materi/bab2/deklarasi-inialisasi",
            label: "2.4 Deklarasi dan Inisialisasi Variabel",
          },
          {
            path: "/materi/bab2/deklarasi-banyak",
            label: "2.5 Deklarasi Banyak Variabel",
          },
          {
            path: "/materi/bab2/variabel-konstanta",
            label: "2.6 Variabel Konstanta",
          },
          { path: "/materi/bab2/sintaks-input", label: "2.7 Sintaks Input" },
          { path: "/materi/bab2/latihan-bab2", label: "Latihan" },
          { path: "/materi/bab2/kuis-bab2", label: "KUIS" },
          { path: "/materi/bab2/rangkuman-bab2", label: "Rangkuman" },
        ],
      },
      {
        id: "bab3",
        judul: "TIPE DATA",
        icon: "tipeDataIcon",
        subBab: [
          {
            path: "/materi/bab3/pengertian-tipedata",
            label: "3.1 Pengertian Tipe Data",
          },
          {
            path: "/materi/bab3/klasifikasi-tipedata",
            label: "3.2 Klasifikasi Tipe Data",
          },
          {
            path: "/materi/bab3/tipe-data-dasar",
            label: "3.3 Tipe Data Dasar",
          },
          { path: "/materi/bab3/integer", label: "3.4 Integer" },
          { path: "/materi/bab3/floating-point", label: "3.5 Floating-point" },
          { path: "/materi/bab3/boolean", label: "3.6 Boolean" },
          { path: "/materi/bab3/char", label: "3.7 Char" },
          { path: "/materi/bab3/string", label: "3.8 String" },
          { path: "/materi/bab3/latihan-bab3", label: "Latihan" },
          { path: "/materi/bab3/kuis-bab3", label: "KUIS" },
          { path: "/materi/bab3/rangkuman-bab3", label: "Rangkuman" },
        ],
      },
      {
        id: "bab4",
        judul: "OPERATOR",
        icon: "operatorIcon",
        subBab: [
          {
            path: "/materi/bab4/pengertian-operator",
            label: "4.1 Pengertian Operator",
          },
          {
            path: "/materi/bab4/operator-arithmetic",
            label: "Operator Arithmetic (Aritmatika)",
          },
          {
            path: "/materi/bab4/operator-increment-decrement",
            label: "Operator Increment dan Decrement",
          },
          {
            path: "/materi/bab4/operator-assignment",
            label: "Operator Assignment (Penugasan)",
          },
          {
            path: "/materi/bab4/operator-comparison",
            label: "Operator Comparison (Perbandingan)",
          },
          { path: "/materi/bab4/operator-logika", label: "Operator Logika" },
          {
            path: "/materi/bab4/operator-conditional",
            label: "Operator Conditional (Bersyarat)",
          },
          {
            path: "/materi/bab4/operator-equality",
            label: "Operator Equality (Kesetaraan)",
          },
          { path: "/materi/bab4/latihan-bab4", label: "Latihan" },
          { path: "/materi/bab4/kuis-bab4", label: "KUIS" },
          { path: "/materi/bab4/rangkuman-bab4", label: "Rangkuman" },
        ],
      },
      {
        id: "bab5",
        judul: "KONTROL ALUR",
        icon: "kontrolAlurIcon",
        subBab: [
          {
            path: "/materi/bab5/pengertian-kontrol-alur",
            label: "5.1 Pengertian Kontrol Alur",
          },
          {
            path: "/materi/bab5/pernyataan-if-else",
            label: "5.2 Pernyataan If-Else",
          },
          {
            path: "/materi/bab5/pernyataan-switch",
            label: "5.3 Pernyataan Switch",
          },
          {
            path: "/materi/bab5/pernyataan-perulangan",
            label: "5.4 Pernyataan Perulangan (for, while, do-while)",
          },
          {
            path: "/materi/bab5/pernyataan-break-continue",
            label: "5.5 Pernyataan Break dan Continue",
          },
          {
            path: "/materi/bab5/perulangan-bersarang",
            label: "5.6 Perulangan Bersarang",
          },
          { path: "/materi/bab5/latihan-bab5", label: "Latihan" },
          { path: "/materi/bab5/kuis-bab5", label: "KUIS" },
          { path: "/materi/bab5/rangkuman-bab5", label: "Rangkuman" },
        ],
      },
      {
        id: "bab6",
        judul: "METHOD",
        icon: "methodIcon",
        subBab: [
          {
            path: "/materi/bab6/pengenalan-method",
            label: "6.1 Pengenalan Method",
          },
          { path: "/materi/bab6/method-void", label: "6.2 Method Void" },
          {
            path: "/materi/bab6/method-tipe-data",
            label: "6.3 Method Dengan Tipe Data",
          },
          {
            path: "/materi/bab6/parameter-method",
            label: "6.4 Parameter Method",
          },
          { path: "/materi/bab6/latihan-bab6", label: "Latihan" },
          { path: "/materi/bab6/kuis-bab6", label: "KUIS" },
          { path: "/materi/bab6/rangkuman-bab6", label: "Rangkuman" },
        ],
      },
      {
        id: "evaluasi",
        judul: "EVALUASI",
        icon: "evaluasi",
        subBab: [
          {
            path: "/materi/evaluasi/evaluasi-akhir",
            label: "Evaluasi Akhir",
          },
          {
            path: "/materi/evaluasi/penutup",
            label: "Penutup",
          },
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
// ok
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
