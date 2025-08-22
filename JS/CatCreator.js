import {uploadImg} from "../Firebase/uploadImg.js";
import {userid} from "../Firebase/getUserInfo.js";
import {doc, updateDoc} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {db} from "../Firebase/firebase.js";

export const CatCreator = {
  template: `
    <div>
      <div class="kassi_tegemine" @click="openPopup">Change Kitty Appearance →</div>
      
      <div v-if="isPopupVisible" class="popup-overlay" @click="closePopup">
        <div class="popup-content" @click.stop>
          <h2>Changing your cat's appearance</h2>
              If you wish to change parts about your cat, you can do so by using a handy Picrew maker. Follow these steps:
            <ol>
              <li>Go to the <a href="https://picrew.me/en/image_maker/35494" target="_blank">cat creator page</a>.</li>
              <li>Design your cat however you want</li>
              <li>Download it and upload the image here</li>
            </ol>
          
          <div class="file-upload-wrapper">
              <label for="file-upload" class="upload-button">
                Upload File
              </label>
              <input id="file-upload" type="file" @change="handleFileUpload" accept="image/png, image/jpeg" />
          </div>
          <button class="popup-close-button" @click="closePopup">X</button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      isPopupVisible: false,
    };
  },
  methods: {
    openPopup() {
      this.isPopupVisible = true;
    },
    closePopup() {
      this.isPopupVisible = false;
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const validTypes = ["image/png", "image/jpeg"];
        if (!validTypes.includes(file.type)) {
          alert("Invalid file type. Please upload a .png or .jpeg image.");
          return;
        }
        await this.addProfileImg(file)
        alert(`File uploaded: ${file.name}`);
      }
    },

    async addProfileImg(file) {
      try {
          const imgURL = await uploadImg(file, `users/${userid}/`, "profile");

          if (imgURL) {
              await updateDoc(doc(db, "profiles", userid), {
              profileImg: imgURL
              })
          }
          console.log("Profile pic info added to DB");
      } catch (error) {
          console.log("Error adding profile pic info to DB:", error.code, error.message);
      }
    }
  }
};
