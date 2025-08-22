import { auth, db } from "../firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc, query, collection, where, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function signUp () {

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password || !username) {
        alert("Please enter your username, email and password.");
        return;
    }

    const usernameMessage = await checkUsername(username);
    if (usernameMessage) {
        alert(usernameMessage);
        return;
    }

     try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User created:");

        await setDoc(doc(db, "profiles", user.uid), {
            username: username,
            email: email,
            role: "user",
            createdAt: serverTimestamp(),
            profileImg: "https://firebasestorage.googleapis.com/v0/b/iti0105-2024.appspot.com/o/users%2FdefaultProfileImg%2Fkiisu1.png?alt=media&token=707ff02f-e879-4a37-a7d4-f37d5ffaf269",
            blocked: false,
        });
        console.log("Data added",);

        alert(`Welcome, ${username}!`)

        window.location.href = "../HTML/Foorum.html";

        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;

            console.log("Problem signing up:", errorCode, errorMessage);

            if (errorCode === "auth/password-does-not-meet-requirements") {
                alert("Password must be 8-12 characters long and include at least on uppercase letter " +
                    "and one number.");
            } else {
                alert(errorMessage.split('/')[1].split(")")[0].replace(/-/g, " "));
            }
        }
}


function checkUsernameFormat(username) {
    if (5 > username.length) {
        return "Username too short. Must be between 5 and 9 characters!";
    }
    if (9 < username.length) {
        return "Username too long. Must be between 5 and 16 characters!";
    }

    const pattern = /^[a-z\d]+$/;
    if (!pattern.test(username)) {
        return "Username can contain only lower case letters and numbers!";
    }

    return null;
}


async function isUsernameUnique(username) {
    try {
        const dataQuery = query(
            collection(db, "profiles"),
            where("username", "==", username),
            limit(1),
        )

        const querySnapshot = await getDocs(dataQuery);

        if (!querySnapshot.empty) {
            return "Username already exists!"
        }

        return null;
    } catch (error) {
        console.log(error);
        return "Error";
    }
}


async function checkUsername(username) {
    const messageFormat = checkUsernameFormat(username);
    const messageUnique = await isUsernameUnique(username);

    if (messageFormat) {
        return messageFormat
    }

    return messageUnique;
}
