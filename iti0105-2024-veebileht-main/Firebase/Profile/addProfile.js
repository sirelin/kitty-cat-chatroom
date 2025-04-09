import { db } from "../firebase.js";
import { updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { userid } from "../getUserInfo.js";
import { uploadImg } from "../uploadImg.js";


export async function addBio() {
    const bio = document.getElementById("bio").value

    try {
        await updateDoc(doc(db, "profiles", userid), {
            bio: bio
        })
        console.log("Bio added to DB")
    } catch(error) {
        console.log("Error adding bio to DB:", error.code, error.message);
        alert("Error adding bio");
    }
}


async function addProfileImg() {
    const fileInput = document.getElementById("img");
    const file = fileInput.files[0];

    try {
        const imgURL = await uploadImg(file, `users/${userid}/`, "profile");

        if (imgURL) {
            await updateDoc(doc(db, "profiles", userid), {
            profileImg: imgURL
            })
        }
        console.log("Profile pic info added to DB")
    } catch (error) {
        console.log("Error adding profile pic info to DB:", error.code, error.message)
    }
}
