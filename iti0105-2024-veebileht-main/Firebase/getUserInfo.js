import { auth, db } from "./firebase.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

export const userid = await getUserID();
export const username = await getUsername();


async function getUserID() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user.uid);
            } else {
                console.log('No user is signed in.');
                resolve(null);
            }
        });
    });
}


async function getUsername() {
    const userid = await getUserID();
    const docSnap = await getDoc(doc(db, "profiles", userid));

    if (docSnap.exists()) {
        return docSnap.data().username;
    }
}

export async function getUserInfo(id) {
    try {
        const docSnap = await getDoc(doc(db, "profiles", id));

        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch(error) {
        console.log("Error gettting user", error.code, error.message);
    }
}
