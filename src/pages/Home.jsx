import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import AddNameForm from "../components/AddNameForm";
import NameList from "../components/NameList";

function Home() {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [logs, setLogs] = useState([]);
    const [selectedDate, setSelectedDate] = useState( new Date().toISOString().split("T")[0]);
    const [showStudentList, setShowStudentList] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState("all");
    const [showClassModal, setShowClassModal] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [showUndoAbsentModal, setShowUndoAbsentModal] = useState(false);
    const [studentToUndoAbsent, setStudentToUndoAbsent] = useState(null);


    const classesCollectionRef = collection(db, "classes");

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [selectedDate, selectedClassId]);


    const loadClasses = async () => {
        const data = await getDocs(classesCollectionRef);

        const classList = await Promise.all(
            data.docs.map(async (document) => {
                const peopleCollectionRef = collection(
                    db,
                    "classes",
                    document.id,
                    "people"
                );

                const peopleData = await getDocs(peopleCollectionRef);

                const peopleList = peopleData.docs
                    .map((personDoc) => ({
                        id: personDoc.id,
                        ...personDoc.data(),
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));

                return {
                    id: document.id,
                    ...document.data(),
                    people: peopleList,
                };
            })
        );

        const activeClasses = classList.filter(
            (classGroup) => classGroup.archived !== true
        );

        setClasses(activeClasses);

        if (activeClasses.length > 0) {
            setSelectedClassId((currentSelectedId) => {
                const stillExists = activeClasses.some(
                    (classGroup) => classGroup.id === currentSelectedId
                );

                return stillExists ? currentSelectedId : activeClasses[0].id;
            });
        } else {
            setSelectedClassId("");
        }
    };

    const selectedClass = classes.find(
        (classGroup) => classGroup.id === selectedClassId
    );

    const addClass = async () => {
        if (!newClassName.trim()) return;

        const newClass = await addDoc(classesCollectionRef, {
            className: newClassName.trim(),
        });

        await loadClasses();

        setSelectedClassId(newClass.id);

        setNewClassName("");
        setShowClassModal(false);
    };

    const archiveClass = async () => {
        if (!selectedClass) return;

        const confirmArchive = window.confirm(
            `Archive ${selectedClass.className}? This will hide the class but keep all records saved.`
        );

        if (!confirmArchive) return;

        const classRef = doc(db, "classes", selectedClass.id);

        await updateDoc(classRef, {
            archived: true,
        });

        await loadClasses();
    };

    const addPerson = async (name) => {
        if (!selectedClass) return;

        const peopleCollectionRef = collection(
            db,
            "classes",
            selectedClass.id,
            "people"
        );

        await addDoc(peopleCollectionRef, {
            name: name,
            active: true,
        });

        loadPeopleForClass(selectedClass.id);
    };

    const loadPeopleForClass = async (classId) => {
        const peopleCollectionRef = collection(
            db,
            "classes",
            classId,
            "people"
        );

        const data = await getDocs(peopleCollectionRef);

        const peopleList = data.docs
            .map((document) => ({
                id: document.id,
                ...document.data(),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        setClasses((prevClasses) =>
            prevClasses.map((classGroup) =>
                classGroup.id === classId
                    ? { ...classGroup, people: peopleList }
                    : classGroup
            )
        );
    };

    const deletePerson = async (id) => {
        if (!selectedClass) return;

        await deleteDoc(
            doc(db, "classes", selectedClass.id, "people", id)
        );

        await loadPeopleForClass(selectedClass.id);

        if (selectedStudentId === id) {
            setSelectedStudentId("all");
        }
    };

    const handleClassChange = async (e) => {
        const classId = e.target.value;
        setSelectedClassId(classId);
        await loadPeopleForClass(classId);
    };

    const handleCheckAction = async (person, action) => {
        if (!selectedClass) return;

        const logsCollectionRef = collection(db, "attendanceLogs");

        await addDoc(logsCollectionRef, {
            personId: person.id,
            name: person.name,
            classId: selectedClass.id,
            className: selectedClass.className,
            action: action,
            timestamp: serverTimestamp(),
            date: selectedDate,
        });

        const personRef = doc(
            db,
            "classes",
            selectedClass.id,
            "people",
            person.id
        );

        await updateDoc(personRef, {
            status: action,
        });

        await loadPeopleForClass(selectedClass.id);
        loadLogs();
    };

    const handleFinalCheckout = async (person) => {
        if (!selectedClass) return;

        const logsCollectionRef = collection(db, "attendanceLogs");

        await addDoc(logsCollectionRef, {
            personId: person.id,
            name: person.name,
            classId: selectedClass.id,
            className: selectedClass.className,
            action: "Final Checkout",
            timestamp: serverTimestamp(),
            date: selectedDate, // 🔥 important
        });

        loadLogs();
    };

    const loadLogs = async () => {
        if (!selectedClassId) return;

        const logsCollectionRef = collection(db, "attendanceLogs");

        const data = await getDocs(logsCollectionRef);

        const logsList = data.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        const filteredLogs = logsList.filter(
            (log) =>
                log.date === selectedDate &&
                log.classId === selectedClassId
        );

        setLogs(filteredLogs.reverse());
    };

    const getPersonState = (person) => {
        const personLogs = logs.filter(
            (log) =>
                log.personId === person.id &&
                log.date === selectedDate
        );

        const sortedLogs = [...personLogs].sort((a, b) => {
            const timeA = a.timestamp?.toDate?.() || new Date(0);
            const timeB = b.timestamp?.toDate?.() || new Date(0);

            return timeA - timeB;
        });

        const hasFinal = sortedLogs.some(
            (log) => log.action === "Final Checkout"
        );

        const lastAction =
            sortedLogs.length > 0
                ? sortedLogs[sortedLogs.length - 1].action
                : null;

        return {
            isFinal: hasFinal,
            lastAction,
        };
    };

    const getActionLabel = (action) => {
        if (action === "Check In") return "🟢 Check In";
        if (action === "Check Out") return "🟠 Check Out";
        if (action === "Final Checkout") return "🔵 Final Checkout";
        if (action === "Absent") return "⚫ Absent";
        return action;
    };

    const handleUndoAbsent = (person) => {
        setStudentToUndoAbsent(person);
        setShowUndoAbsentModal(true);
    };

    const confirmUndoAbsent = async () => {
        if (!selectedClass || !studentToUndoAbsent) return;

        const logsCollectionRef = collection(db, "attendanceLogs");

        const absentQuery = query(
            logsCollectionRef,
            where("personId", "==", studentToUndoAbsent.id),
            where("classId", "==", selectedClass.id),
            where("date", "==", selectedDate),
            where("action", "==", "Absent")
        );

        const absentLogs = await getDocs(absentQuery);

        absentLogs.forEach(async (logDoc) => {
            await deleteDoc(doc(db, "attendanceLogs", logDoc.id));
        });

        setShowUndoAbsentModal(false);
        setStudentToUndoAbsent(null);

        await loadLogs();
    };

    return (
        <div className="app-container">

            <div className="header-card">
                <h1>🌈 Berkys Daycare 2 Check-In</h1>
            </div>

            <div className="controls-card">

                <button onClick={() => setShowClassModal(true)}>
                    Add Class
                </button>

                {classes.length > 0 && (
                    <>
                        <label style={{ marginLeft: "10px" }}>
                            Select Class:
                        </label>

                        <select
                            value={selectedClassId}
                            onChange={handleClassChange}
                        >
                            {classes.map((classGroup) => (
                                <option
                                    key={classGroup.id}
                                    value={classGroup.id}
                                >
                                    {classGroup.className}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={archiveClass}
                            className="delete-button"
                            style={{ marginLeft: "10px" }}
                        >
                            Archive Class
                        </button>
                    </>
                )}
            </div>

            {showClassModal && (
                <div className="modal-overlay">
                    <div className="modal-card">

                        <h2>📚 Create New Class</h2>

                        <input
                            type="text"
                            placeholder="Enter class name"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                        />

                        <div className="modal-buttons">

                            <button onClick={addClass}>
                                Create
                            </button>

                            <button
                                className="delete-button"
                                onClick={() => {
                                    setShowClassModal(false);
                                    setNewClassName("");
                                }}
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {showUndoAbsentModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2>↩️ Undo Absence?</h2>

                        <p>
                            This will remove the absence log for{" "}
                            <strong>{studentToUndoAbsent?.name}</strong> on the selected date.
                        </p>

                        <div className="modal-buttons">
                            <button onClick={confirmUndoAbsent}>
                                Yes, Undo
                            </button>

                            <button
                                className="delete-button"
                                onClick={() => {
                                    setShowUndoAbsentModal(false);
                                    setStudentToUndoAbsent(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedClass ? (
                <>

                    <div className="attendance-card">

                        <h2 className="section-title">
                            🎓 {selectedClass.className}
                        </h2>

                        <div className="student-controls">
                            <AddNameForm onAddPerson={addPerson} />

                            <button
                                className="toggle-button"
                                onClick={() => setShowStudentList(!showStudentList)}
                            >
                                {showStudentList
                                    ? "📕 Hide Student List"
                                    : "📖 Show Student List"}
                            </button>
                        </div>

                        {showStudentList && (
                            <NameList
                                people={[...(selectedClass.people || [])].sort((a, b) => {
                                    const stateA = getPersonState(a).lastAction;
                                    const stateB = getPersonState(b).lastAction;

                                    if (stateA === "Absent" && stateB !== "Absent") return 1;
                                    if (stateA !== "Absent" && stateB === "Absent") return -1;

                                    return a.name.localeCompare(b.name);
                                })}
                                onDeletePerson={deletePerson}
                                onCheckAction={handleCheckAction}
                                onFinalCheckout={handleFinalCheckout}
                                onUndoAbsent={handleUndoAbsent}
                                getPersonState={getPersonState}
                            />
                        )}

                    </div>

                    <div className="attendance-card">

                        <h2 className="section-title">
                            📋 Attendance Logs
                        </h2>

                        <div className="log-filters">

                            <div className="filter-group">
                                <label>Select Date:</label>

                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                />
                            </div>

                            <div className="filter-group">
                                <label>Select Student:</label>

                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                >
                                    <option value="all">All Students</option>

                                    {(selectedClass.people || []).map((person) => (
                                        <option key={person.id} value={person.id}>
                                            {person.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        {Object.entries(
                            logs
                                .filter((log) =>
                                    selectedStudentId === "all"
                                        ? true
                                        : log.personId === selectedStudentId
                                )
                                .reduce((groups, log) => {
                                    if (!groups[log.name]) {
                                        groups[log.name] = [];
                                    }

                                    groups[log.name].push(log);
                                    return groups;
                                }, {})
                            )
                            .sort((a, b) => {
                                const aIsAbsent = a[1].some((log) => log.action === "Absent");
                                const bIsAbsent = b[1].some((log) => log.action === "Absent");

                                if (aIsAbsent && !bIsAbsent) return 1;
                                if (!aIsAbsent && bIsAbsent) return -1;

                                return a[0].localeCompare(b[0]);
                            })
                            .map(([name, personLogs]) => (
                            <div
                                key={name}
                                className="log-card"
                            >
                                <h3>{name}</h3>

                                {[...personLogs]
                                    .sort((a, b) => {
                                        const timeA = a.timestamp?.toDate?.() || new Date(0);
                                        const timeB = b.timestamp?.toDate?.() || new Date(0);

                                        return timeA - timeB;
                                    })
                                    .map((log) => (
                                        <div
                                            key={log.id}
                                            style={{ marginBottom: "6px" }}
                                        >
                                            {log.className} -{" "}

                                            <span style={{ fontWeight: "bold" }}>
                                                {getActionLabel(log.action)}
                                            </span>

                                            {" - "}

                                            {log.timestamp
                                                ?.toDate()
                                                .toLocaleString()}
                                        </div>
                                    ))}
                            </div>
                        ))}

                    </div>

                </>
            ) : (
                <div className="attendance-card">
                    <p>No class selected. Add a class to begin.</p>
                </div>
            )}

        </div>
    );
}

export default Home;