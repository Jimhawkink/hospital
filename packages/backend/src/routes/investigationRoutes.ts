// src/routes/investigationRoutes.ts
import { Router } from "express";
import { InvestigationRequest } from "../models/InvestigationRequest";
import { InvestigationResult } from "../models/InvestigationResult";
import { InvestigationTest } from "../models/InvestigationTest";
import { Staff } from "../models/Staff";
import { Encounter } from "../models/Encounter";

const router = Router();

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
};

// GET - Fetch investigation requests by encounter_id
router.get("/", async (req, res) => {
  try {
    const encounter_id = req.query.encounter_id as string | undefined;

    if (!encounter_id) {
      return res.status(400).json({ success: false, error: "encounter_id is required" });
    }

    const requests = await InvestigationRequest.findAll({
      where: { encounter_id },
      include: [
        {
          model: InvestigationResult,
          as: 'investigationResults'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('❌ Error fetching investigation requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch investigation requests', details: getErrorMessage(error) });
  }
});

/**
 * POST / - Create one or multiple investigation requests
 */
router.post("/", async (req, res) => {
  const sequelizeInstance = (InvestigationRequest as any).sequelize;

  try {
    // Normalize payload
    let payloadRequests: any[] = [];
    if (Array.isArray(req.body.requests)) {
      payloadRequests = req.body.requests;
    } else if (req.body && Object.keys(req.body).length > 0) {
      payloadRequests = [req.body];
    } else {
      return res.status(400).json({ success: false, error: 'Request body is required' });
    }

    console.log('📥 Received requests payload (count=', payloadRequests.length, '):', payloadRequests);

    const createdRequests: any[] = [];
    await sequelizeInstance.transaction(async (t: any) => {
      for (const r of payloadRequests) {
        const { encounter_id, test_id, test_name, department, type, status, request_notes, requested_by, date_requested } = r;

        if (!encounter_id) throw { status: 400, message: 'encounter_id is required' };
        if (!requested_by) throw { status: 400, message: 'requested_by is required' };

        // Validate encounter
        const encounter = await Encounter.findByPk(encounter_id, { transaction: t });
        if (!encounter) throw { status: 404, message: `Encounter id=${encounter_id} not found` };

        // Validate staff
        const staff = await Staff.findByPk(requested_by, { transaction: t });
        if (!staff) throw { status: 404, message: `Staff id=${requested_by} not found` };

        // Resolve test_name
        let resolvedTestName: string | null = null;
        if (test_id) {
          const test = await InvestigationTest.findByPk(test_id, { transaction: t });
          if (!test) throw { status: 404, message: `InvestigationTest id=${test_id} not found` };
          resolvedTestName = test.name;
        } else if (test_name) {
          const test = await InvestigationTest.findOne({ where: { name: test_name }, transaction: t });
          if (test) resolvedTestName = test.name;
          else {
            // Optionally create missing test
            const createdTest = await InvestigationTest.create({ name: test_name, department: department || null, type: type || null, parameters: null }, { transaction: t });
            resolvedTestName = createdTest.name;
          }
        } else {
          throw { status: 400, message: 'Either test_id or test_name must be provided' };
        }

        // Create request
        const created = await InvestigationRequest.create({
          encounter_id,
          test_id: test_id ?? null,
          test_name: resolvedTestName,
          department: department ?? null,
          type: type ?? 'laboratory',
          status: status ?? 'not_collected',
          request_notes: request_notes ?? null,
          requested_by,
          date_requested: date_requested ? new Date(date_requested) : new Date()
        }, { transaction: t });

        createdRequests.push(created);
      }
    });

    console.log(`✅ Created ${createdRequests.length} investigation request(s)`);
    return res.status(201).json({ success: true, data: createdRequests });

  } catch (error: any) {
    console.error('❌ Error creating investigation requests:', error);
    try { await sequelizeInstance.transaction.rollback(); } catch {}
    if (error?.status && error?.message) return res.status(error.status).json({ success: false, error: error.message });
    if (error?.name === "SequelizeForeignKeyConstraintError") return res.status(400).json({ success: false, error: 'Foreign key constraint failed', details: error?.original?.sqlMessage || error.message });
    if (error?.name === "SequelizeValidationError") {
      const messages = error.errors.map((e: any) => ({ path: e.path, message: e.message }));
      return res.status(400).json({ success: false, error: 'Validation failed', messages });
    }
    return res.status(500).json({ success: false, error: 'Failed to create investigation requests', message: getErrorMessage(error) });
  }
});

// Legacy route: POST /encounters/:id
router.post("/encounters/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { testIds, otherRequest, requestNotes, requestedBy } = req.body;
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid encounter id' });

    const requestedByStaffId = requestedBy ?? 1;
    const savedRequests: any[] = [];

    if (Array.isArray(testIds) && testIds.length > 0) {
      for (const testId of testIds) {
        const test = await InvestigationTest.findByPk(testId);
        if (test) {
          const reqRow = await InvestigationRequest.create({
            encounter_id: id,
            test_id: test.id,
            test_name: test.name,
            department: test.department,
            type: test.type,
            status: "not_collected",
            request_notes: requestNotes ?? null,
            requested_by: requestedByStaffId,
            date_requested: new Date()
          });
          savedRequests.push(reqRow);
        } else console.warn(`❌ Test not found for ID ${testId}`);
      }
    }

    if (otherRequest) {
      const reqRow = await InvestigationRequest.create({
        encounter_id: id,
        test_id: null,
        test_name: otherRequest,
        department: null,
        type: "laboratory",
        status: "not_collected",
        request_notes: requestNotes ?? null,
        requested_by: requestedByStaffId,
        date_requested: new Date()
      });
      savedRequests.push(reqRow);
    }

    return res.json({ success: true, requests: savedRequests });

  } catch (error) {
    console.error('❌ Failed to save legacy investigation requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to save investigation requests', details: getErrorMessage(error) });
  }
});

// Legacy: POST /requests/:id/results
router.post("/requests/:id/results", async (req, res) => {
  const sequelizeInstance = (InvestigationResult as any).sequelize;
  try {
    const requestId = Number(req.params.id);
    const { results, enteredBy } = req.body;
    if (!Array.isArray(results) || results.length === 0) return res.status(400).json({ success: false, error: 'results array is required' });

    const createdResults: any[] = [];
    await sequelizeInstance.transaction(async (t: any) => {
      for (const r of results) {
        const resRow = await InvestigationResult.create({
          request_id: requestId,
          parameter: r.parameter ?? null,
          value: r.value,
          unit: r.unit ?? null,
          reference_range: r.reference_range ?? null,
          flag: r.flag ?? null,
          notes: r.notes ?? null,
          entered_by: enteredBy ?? 1,
          date_entered: r.date_entered ? new Date(r.date_entered) : new Date()
        }, { transaction: t });
        createdResults.push(resRow);
      }

      await InvestigationRequest.update({ status: "results_posted" }, { where: { id: requestId }, transaction: t });
    });

    return res.json({ success: true, results: createdResults });
  } catch (error) {
    console.error('❌ Failed to save legacy results:', error);
    return res.status(500).json({ success: false, error: 'Failed to save results', details: getErrorMessage(error) });
  }
});

// Alternative: POST /:id/results
router.post("/:id/results", async (req, res) => {
  const sequelizeInstance = (InvestigationResult as any).sequelize;
  try {
    const requestId = Number(req.params.id);
    const { results, additional_notes, status } = req.body;
    if (!requestId || isNaN(requestId)) return res.status(400).json({ success: false, error: 'Invalid request id' });
    if (!Array.isArray(results) || results.length === 0) return res.status(400).json({ success: false, error: 'results array is required' });

    const createdResults: any[] = [];
    await sequelizeInstance.transaction(async (t: any) => {
      for (const r of results) {
        const resRow = await InvestigationResult.create({
          request_id: requestId,
          parameter: r.parameter ?? null,
          value: r.value,
          unit: r.unit ?? null,
          reference_range: r.reference_range ?? null,
          flag: r.flag ?? null,
          notes: r.notes ?? additional_notes ?? null,
          entered_by: r.entered_by ?? 1,
          date_entered: r.date_entered ? new Date(r.date_entered) : new Date()
        }, { transaction: t });
        createdResults.push(resRow);
      }

      await InvestigationRequest.update(
        { status: status ?? 'results_posted', request_notes: additional_notes ?? undefined },
        { where: { id: requestId }, transaction: t }
      );
    });

    return res.status(201).json({ success: true, results: createdResults });
  } catch (error) {
    console.error('❌ Failed to save results:', error);
    const details = (error as any)?.errors ? (error as any).errors.map((e: any) => ({ path: e.path, message: e.message })) : undefined;
    return res.status(500).json({ success: false, error: 'Failed to save results', details, message: getErrorMessage(error) });
  }
});

export default router;
