import { db } from "../firebase.js";
import { addDoc, collection, writeBatch, doc, arrayUnion, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {  userid } from "../getUserInfo.js";
import { uploadImg } from "../uploadImg.js";


async function addPostToDB(imgURL) {

    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;
    const tags = document.getElementById("post-hashtags").value.split("#").filter(tag => tag.trim() !== "");

    const filteredTags = [... new Set(tags.map((tag) => tag.trim().toLowerCase()))];

    try {
        const docRef = await addDoc(collection(db, "posts"), {
            author: userid,
            date: serverTimestamp(),
            title: title,
            content: content,
            picture: imgURL,
            tags: filteredTags,
            likeCount: 0,
            views: 0,
            commentCount: 0,
        });

        console.log("Post data added")
        return { postID: docRef.id, tags: filteredTags}
    } catch (error) {
        console.log(error.code, error.message);
        alert("Error adding post");
        throw error;
    }
}


async function addTagToDB(postID, tags) {
    try {
        const batch = writeBatch(db);

        for (const tag of tags) {
            batch.set(doc(db, "tags", tag), {
                posts: arrayUnion(postID),
                postCount: increment(1),
            }, {merge: true});
        }

        await batch.commit();
        console.log("Tag data added");

    }catch (error) {
        console.log("Error adding post to tags", error.code, error.message);
        alert("Error adding post");
        throw error;
    }
}

function checkFields() {
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;
    const tags = document.getElementById("post-hashtags").value;
    const fileInput = document.getElementById("file-upload");

    if (!title || !content || !tags || fileInput.files.length === 0) {
        alert("All fields must be filled!")
        return;
    } else if (tags.indexOf("#") !== 0) {
        alert("Each tag must start with a '#'.")
        return;
    } else if (tags.split("#").filter(tag => tag.trim() !== "").length > 3) {
        alert("You can only add a maximum of 3 tags.")
        return;
    }
    return true;

}


export async function addPostInfo() {
    if (!checkFields()) {
        return
    }

    const fileInput = document.getElementById("file-upload");
    const file = fileInput.files[0];
    const fileName = new Date().toISOString();

    try {
        const imgURL = await uploadImg(file, `posts/${userid}/`, fileName);
        const postInfo = await addPostToDB(imgURL);
        await addTagToDB(postInfo.postID, postInfo.tags);
        alert("Post added");
        document.getElementById("post-title").value = "";
        document.getElementById("post-content").value = "";
        document.getElementById("post-hashtags").value = "";
        document.getElementById("file-upload").value  = "";
        return true;
    } catch (error) {
        console.log("Error in addPostInfo", error.code, error.message);
    }
}
