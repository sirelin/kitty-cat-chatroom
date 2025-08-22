import { auth, db } from "../firebase.js";
import { getDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


export async function signIn () {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const blockedStatus = await checkBlockedStatus(user.uid);
        if (blockedStatus) {
            alert("It seems like your account has been blocked for some reason. Please reach out to our support team if you think this was an error.")
            return;
        }

        console.log("User logged in");
        await updateRecentLogin(user.uid)

        alert(`Welcome back!`)

        window.location.href = "../HTML/Foorum.html";

    } catch(error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            const Message = errorMessage.split('/')[1].split(")")[0].replace(/-/g, " ");
            console.log("Problem signing in:", errorCode, errorMessage);
            alert(Message);
    }
}


async function updateRecentLogin(user) {
    try {
        await updateDoc(doc(db, "profiles", user),{
            recentLogin: serverTimestamp()
        })

    } catch (error) {
        console.log("Error adding recent login", error.code, error.message)
    }
}

async function checkBlockedStatus(user) {
    try {
        const docSnap = await getDoc(doc(db, "profiles", user))

        return docSnap.data().blocked;

    } catch (error) {
        console.log("Error checking blocked status", error.code, error.message);
        throw error;
    }
}


export async function signInAdmin(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const adminStatus = await validateAdmin(user.uid);

        if (adminStatus) {
            console.log("Admin logged in");
            alert("Welcome back!");
            window.location.href = "../HTML/Admin_home.html";
        } else {
            alert("Only admin can enter!");
        }

    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        const Message = errorMessage.split('/')[1].split(")")[0].replace(/-/g, " ");
        console.log("Problem signing in:", errorCode, errorMessage);
        alert(Message);
    }
}


async function validateAdmin(user) {
    try {
        const docSnap = await getDoc(doc(db, "profiles", user));
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData.role === "admin";
        } else {
            console.log("No user data found");
            return false;
        }
    } catch (error) {
        console.log("Error fetching user data", error.code, error.message);
        throw error;
    }
}
