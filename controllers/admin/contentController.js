import Event from '../../models/Event.js';
import Achievement from '../../models/Achievement.js';
import Announcement from '../../models/Announcement.js';
import { sendAnnouncementEmail } from '../../utils/sendEmail.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import Parent from '../../models/Parent.js';
// --- EVENT ---
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const createEvent = async (req, res) => {
  try {
    const photo = req.file ? req.file.path.replace(/\\/g, '/') : '';
    const event = await Event.create({ ...req.body, photo });
    res.json(event);
  } catch {
    res.status(500).json({ message: 'Error creating event' });
  }
};

export const getEvents = async (req, res) => {
  const events = await Event.find().sort({ date: -1 });
  res.json(events);
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (req.file) update.photo = req.file.path.replace(/\\/g, '/');
    const event = await Event.findByIdAndUpdate(id, update, { new: true });
    res.json(event);
  } catch {
    res.status(500).json({ message: 'Error updating event' });
  }
};

export const deleteEvent = async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: 'Event deleted' });
};

// --- ACHIEVEMENT ---
export const createAchievement = async (req, res) => {
  try {
    const photo = req.file ? req.file.path.replace(/\\/g, '/') : '';
    const achievement = await Achievement.create({ ...req.body, photo });
    res.json(achievement);
  } catch {
    res.status(500).json({ message: 'Error creating achievement' });
  }
};

export const getAchievements = async (req, res) => {
  const achievements = await Achievement.find().sort({ date: -1 });
  res.json(achievements);
};

export const updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (req.file) update.photo = req.file.path.replace(/\\/g, '/');
    const achievement = await Achievement.findByIdAndUpdate(id, update, { new: true });
    res.json(achievement);
  } catch {
    res.status(500).json({ message: 'Error updating achievement' });
  }
};

export const deleteAchievement = async (req, res) => {
  await Achievement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Achievement deleted' });
};

// --- ANNOUNCEMENT ---
export const createAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    const announcement = await Announcement.create({ message });

    const [students, teachers, parents] = await Promise.all([
      Student.find({ status: 'active' }, 'email'),
      Teacher.find({ status: 'active' }, 'email'),
      Parent.find({ status: 'active' }, 'email'),
    ]);

    const allEmails = [
      ...students.map(u => u.email),
      ...teachers.map(u => u.email),
      ...parents.map(u => u.email),
    ];

    await sendAnnouncementEmail(allEmails, message);

    res.json({ message: 'Announcement created and emails sent.', announcement });
  } catch (err) {
    console.error('Error in announcement:', err.message);
    res.status(500).json({ message: 'Error creating announcement or sending emails.' });
  }
};

export const getAnnouncements = async (req, res) => {
  const announcements = await Announcement.find().sort({ date: -1 });
  res.json(announcements);
};

export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(announcement);
  } catch {
    res.status(500).json({ message: 'Error updating announcement' });
  }
};

export const deleteAnnouncement = async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Announcement deleted' });
};
