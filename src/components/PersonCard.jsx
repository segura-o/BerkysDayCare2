function PersonCard({
                        person,
                        onDeletePerson,
                        onCheckAction,
                        onFinalCheckout,
                        onUndoAbsent,
                        state,
                    }) {
    const isFinal = state?.isFinal;
    const status = state?.lastAction;
    const isAbsent = status === "Absent";

    return (
        <div className={`person-card ${isFinal || isAbsent ? "person-finalized" : ""}`}>
            <span className="person-name">{person.name}</span>

            <button
                disabled={status === "Check In" || isFinal || isAbsent}
                onClick={() => onCheckAction(person, "Check In")}
            >
                {status === "Check In" ? "✅ Checked In" : "Check In"}
            </button>

            <button
                disabled={status === "Check Out" || isFinal || isAbsent}
                onClick={() => onCheckAction(person, "Check Out")}
            >
                {status === "Check Out" ? "✅ Checked Out" : "Check Out"}
            </button>

            <button
                className="final-button"
                disabled={isFinal || isAbsent}
                onClick={() => onFinalCheckout(person)}
            >
                {isFinal ? "🔒 Finalized" : "Final Checkout"}
            </button>

            {isAbsent ? (
                <button
                    className="undo-absent-button"
                    onClick={() => onUndoAbsent(person)}
                >
                    ↩️ Undo Absent
                </button>
            ) : (
                <button
                    className="absent-button"
                    disabled={isFinal}
                    onClick={() => onCheckAction(person, "Absent")}
                >
                    Absent
                </button>
            )}

            <button
                className="delete-button"
                onClick={() => onDeletePerson(person.id)}
            >
                Delete
            </button>
        </div>
    );
}

export default PersonCard;