import { PythonShell } from 'python-shell';
import path from 'path';
import InternalMark from '../models/InternalMark.js';

export const predictFinalMarks = async (req, res) => {
  try {
    const { internalMarks, code } = req.body;

    console.log('📥 Received internalMarks:', internalMarks);
    console.log('📘 Subject code:', code);

    const options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: path.resolve('ml_models'),
    };

    const pyshell = new PythonShell('predict_final.py', options);
    let result = '';

    pyshell.on('message', (message) => {
      console.log('✅ Python message:', message);
      result += message;
    });

    pyshell.on('stderr', (stderr) => {
      console.error('⚠️ Python stderr:', stderr);
    });

    pyshell.send(JSON.stringify({ internalMarks, code }));

    pyshell.end(async (err) => {
      if (err) {
        console.error('❌ PythonShell error:', err);
        return res.status(500).json({ error: 'Prediction failed' });
      }

      try {
        const predictions = JSON.parse(result); // array like [50.94, ...]

        // ✅ Debug: Print predicted values
        console.log('📈 Predictions:', predictions);

        // ✅ Match predictions to students and store in DB
        for (let i = 0; i < internalMarks.length; i++) {
          const m = internalMarks[i];
          const predictedFinal = predictions[i];
          const level = predictedFinal >= 70 ? 1 : predictedFinal >= 50 ? 2 : 3;

          const filter = {
            student: m.studentId,
            code: code,
          };

          const update = {
            predictedFinal,
            level,
          };

          const updated = await InternalMark.findOneAndUpdate(filter, update, { new: true });

          if (updated) {
            console.log(`✅ Updated predictedFinal for student thankyou ${m.studentId}:`, predictedFinal);
          } else {
            console.warn(`⚠️ No InternalMark found for student ${m.studentId} with code ${code}`);
          }
        }

        return res.json({ predictions });

      } catch (jsonErr) {
        console.error('❌ Failed to parse prediction JSON:', jsonErr, result);
        return res.status(500).json({ error: 'Invalid prediction response' });
      }
    });

  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
