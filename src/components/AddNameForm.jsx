import { useState } from "react";

function AddNameForm({ onAddPerson }) {
    const [name, setName] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (name.trim() === "") return;

        onAddPerson(name.trim());
        setName("");
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Enter Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <button type="submit">Add Name</button>
        </form>
    );
}

export default AddNameForm;