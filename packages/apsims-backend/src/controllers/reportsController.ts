import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import Student from '../models/Student';
import ExamResult from '../models/ExamResult';
import FeePayment from '../models/FeePayment';
import FeeStructure from '../models/FeeStructure';

export const generateReportForm = async (req: Request, res: Response) => {
    try {
        const { studentId, term, year } = req.query;

        const student = await Student.findByPk(studentId as string);
        const results = await ExamResult.findAll({ where: { student_id: studentId, term, year } });

        if (!student) return res.status(404).json({ message: 'Student not found' });

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${student.admission_number}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('ALPHA PLUS SCHOOL', { align: 'center' });
        doc.fontSize(12).text('P.O BOX 123, NAIROBI', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('STUDENT REPORT FORM', { align: 'center', underline: true });
        doc.moveDown();

        // Student Details
        doc.fontSize(12).text(`Name: ${student.first_name} ${student.last_name}`);
        doc.text(`ADM No: ${student.admission_number}`);
        doc.text(`Class: ${student.class_level} ${student.stream || ''}`);
        doc.text(`Term: ${term} | Year: ${year}`);
        doc.moveDown();

        // Results Table (Simplified)
        doc.font('Helvetica-Bold').text('Subject          Score    Grade    Points');
        doc.font('Helvetica');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        let totalScore = 0;

        results.forEach(r => {
            doc.text(`${r.subject_id.padEnd(15)}  ${r.score.toString().padEnd(8)} ${r.grade.padEnd(8)} ${r.points}`);
            totalScore += r.score;
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`Total Score: ${totalScore}          Mean Grade: ${results.length > 0 ? (totalScore / results.length).toFixed(1) : '-'}`);

        // Footer
        doc.moveDown(2);
        doc.text('Class Teacher Comments: __________________________________________');
        doc.moveDown();
        doc.text('Principal Signature: ______________________  Date: _______________');

        doc.end();

    } catch (error) {
        res.status(500).json({ message: 'Error generating report', error });
    }
};

export const generateFeeReceipt = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const payment = await FeePayment.findByPk(paymentId as string);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        const student = await Student.findByPk(payment.student_id);

        const doc = new PDFDocument({ size: 'A5', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.reference || payment.id}.pdf`);

        doc.pipe(res);

        // Receipt Content
        doc.fontSize(18).text('ALPHA PLUS SCHOOL', { align: 'center' });
        doc.fontSize(10).text('OFFICIAL RECEIPT', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Date: ${payment.date}       Receipt No: ${payment.id}`);
        doc.moveDown(0.5);
        doc.text(`Student: ${student ? student.first_name + ' ' + student.last_name : 'Unknown'}`);
        doc.text(`ADM No: ${student ? student.admission_number : '-'}`);
        doc.moveDown();

        doc.fontSize(14).text(`Amount Paid: KES ${payment.amount.toLocaleString()}`, { align: 'center' });
        doc.fontSize(10).text(`(Word: ...)`, { align: 'center' });
        doc.moveDown();

        doc.text(`Payment Method: ${payment.method}`);
        doc.text(`Ref: ${payment.reference || '-'}`);
        doc.text(`Paid For: Term ${payment.term} ${payment.year}`);

        doc.moveDown(2);
        doc.text('Served By: __________________________');

        doc.end();

    } catch (error) {
        res.status(500).json({ message: 'Error generating receipt', error });
    }
};
