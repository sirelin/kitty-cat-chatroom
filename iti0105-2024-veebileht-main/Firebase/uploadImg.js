import { storage } from "./firebase.js"
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";


export async function uploadImg(file, folder, fileName) {

    if (file) {
        try {
           const storageRef = ref(storage, folder + fileName)
           await uploadBytes(storageRef, file);

           const imgURL = await getDownloadURL(storageRef);
           console.log("Image added");

           return imgURL
        } catch (error) {
            console.error("Error uploading image: ", error.code, error.message);
            alert("Error uploading image");
            throw error;
        }
    } else {
        console.log("No File");
        alert("Please select a file to upload.");
        throw new Error("File not added");
    }
}
