const express = require('express');
const staff = require('../controllers/staff.controller');
const { StaffError } = require('../services/payroll.service');

const router = express.Router();

function handle(action, duplicateMessage) {
  return async (req, res, next) => {
    // Salary and employee details should never be stored in HTTP caches.
    res.set('Cache-Control', 'no-store');
    try {
      await action(req, res);
    } catch (error) {
      if (error instanceof StaffError) return res.status(error.status).json({ error: error.message });
      if (error.code === 'P2002' && duplicateMessage) {
        return res.status(409).json({ error: duplicateMessage });
      }
      if (error.code === 'P2034') {
        return res.status(409).json({ error: 'Another update occurred. Reload and try again.' });
      }
      return next(error);
    }
  };
}

router.get('/', handle(staff.listEmployees));
router.post('/', handle(staff.createEmployee, 'That employee ID is already in use.'));
router.put('/employees/:id', handle(staff.updateEmployee, 'That employee ID is already in use.'));
router.get('/payroll/:month', handle(staff.getPayroll));
router.post('/payroll/:month/preview', handle(staff.previewPayroll));
router.post('/payroll/:month', handle(staff.savePayroll, 'Payroll for this month is already saved.'));

module.exports = router;
