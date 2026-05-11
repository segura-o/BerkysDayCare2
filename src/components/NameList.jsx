import PersonCard from "./PersonCard";

function NameList({
                      people,
                      onDeletePerson,
                      onCheckAction,
                      onFinalCheckout,
                      onUndoAbsent,
                      getPersonState,
                  }) {
    return (
        <div>
            {people.map((person) => (
                <PersonCard
                    key={person.id}
                    person={person}
                    onDeletePerson={onDeletePerson}
                    onCheckAction={onCheckAction}
                    onFinalCheckout={onFinalCheckout}
                    onUndoAbsent={onUndoAbsent}
                    state={getPersonState(person)}
                />
            ))}
        </div>
    );
}

export default NameList;