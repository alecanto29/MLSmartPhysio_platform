const sessionService = require("../../src/services/sessionService");
const sessionModel = require("../../src/models/Session");
const patientModel = require("../../src/models/Patient");

jest.mock("../../src/models/Session");
jest.mock("../../src/models/Patient");

describe("SessionService", () => {
    const mockDoctorId = "doctor123";
    const mockSessionId = "session123";
    const mockPatientId = "patient123";

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getSession - should return all sessions of a doctor", async () => {
        const mockSessions = [{ _id: "1" }, { _id: "2" }];
        sessionModel.find.mockResolvedValue(mockSessions);

        const result = await sessionService.getSession(mockDoctorId);
        expect(result).toEqual(mockSessions);
        expect(sessionModel.find).toHaveBeenCalledWith({ doctor: mockDoctorId });
    });

    test("getSessionByID - should return session with populated fields", async () => {
        const mockSession = { _id: mockSessionId };

        const mockPopulateSecond = jest.fn().mockResolvedValue(mockSession);
        const mockPopulateFirst = jest.fn().mockReturnValue({ populate: mockPopulateSecond });

        sessionModel.findOne.mockReturnValue({ populate: mockPopulateFirst });

        const result = await sessionService.getSessionByID(mockSessionId, mockDoctorId);
        expect(result).toEqual(mockSession);
        expect(sessionModel.findOne).toHaveBeenCalledWith({ doctor: mockDoctorId, _id: mockSessionId });
    });

    test("getPatientSessionById - should return patient sessions", async () => {
        const mockSessions = [{}, {}];
        sessionModel.find.mockResolvedValue(mockSessions);

        const result = await sessionService.getPatientSessionById(mockPatientId, mockDoctorId);
        expect(result).toEqual(mockSessions);
        expect(sessionModel.find).toHaveBeenCalledWith({ doctor: mockDoctorId, patient: mockPatientId });
    });

    test("createSession - should create and save a session", async () => {
        const mockData = { patient: mockPatientId };
        const mockSavedSession = {
            _id: "sess1",
            patient: mockPatientId,
            save: jest.fn()
        };

        sessionModel.mockImplementation(() => mockSavedSession);
        patientModel.findByIdAndUpdate.mockResolvedValue(true);

        const result = await sessionService.createSession(mockData, mockDoctorId);
        expect(result).toEqual(mockSavedSession);
        expect(mockSavedSession.save).toHaveBeenCalled();
        expect(patientModel.findByIdAndUpdate).toHaveBeenCalledWith(
            mockPatientId,
            { $push: { sessions: mockSavedSession._id } }
        );
    });

    test("updateSession - should update session notes", async () => {
        const updatedNotes = "updated";

        const mockSession = {
            _id: mockSessionId,
            notes: "",
            save: jest.fn().mockResolvedValue(true),
        };

        // Mock catena findOne().populate().populate() per getSessionByID interno
        const mockPopulateSecond = jest.fn().mockResolvedValue(mockSession);
        const mockPopulateFirst = jest.fn().mockReturnValue({ populate: mockPopulateSecond });
        sessionModel.findOne.mockReturnValue({ populate: mockPopulateFirst });

        const result = await sessionService.updateSession({ notes: updatedNotes }, mockDoctorId, mockSessionId);

        expect(result.notes).toEqual(updatedNotes);
        expect(mockSession.save).toHaveBeenCalled();
    });

    test("deleteSessionById - should delete session and update patient", async () => {
        const mockDeletedSession = {
            _id: mockSessionId,
            patient: mockPatientId,
        };

        sessionModel.findOneAndDelete.mockResolvedValue(mockDeletedSession);
        patientModel.findByIdAndUpdate.mockResolvedValue(true);

        const result = await sessionService.deleteSessionById(mockSessionId, mockDoctorId);
        expect(result).toEqual(mockDeletedSession);
        expect(sessionModel.findOneAndDelete).toHaveBeenCalledWith({
            _id: mockSessionId,
            doctor: mockDoctorId
        });
        expect(patientModel.findByIdAndUpdate).toHaveBeenCalledWith(
            mockPatientId,
            { $pull: { sessions: mockSessionId } }
        );
    });
});
