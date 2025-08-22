import { db } from "../Firebase/firebase.js";
import { collection, getDocs, doc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { userid } from "../Firebase/getUserInfo.js";

export const ImageGallery = {
    template: `
        <div class="läbipaistev_taust">
            <div class="piltide_tabel">
                <div 
                    v-for="image in images" 
                    :key="image.id" 
                    class="img"
                    @click="openLightbox(image.src)"
                >
                    <img :src="image.src" :alt="image.alt" />
                </div>
            </div>
      
            <teleport to="body">
                <div v-if="isLightboxOpen" class="lightbox" @click="closeLightbox">
                    <div class="lightbox-content" @click.stop>
                        <img :src="currentImage" alt="Current image" />
                        <button class="close-button" @click="closeLightbox">X</button>
                    </div>
                </div>
            </teleport>  
        </div>
    `,

    data() {
        return {
            isLightboxOpen: false,
            currentImage: '',
            images: []
        };
    },

    methods: {
        openLightbox(imageSrc) {
            this.currentImage = imageSrc;
            this.isLightboxOpen = true;
        },

        closeLightbox() {
            this.isLightboxOpen = false;
        },

        async getFavoriteImgs() {
            try {
                const docRef = query(
                    collection(db, "posts"),
                    orderBy("date", "desc"),
                );

                const docSnap = await getDocs(docRef);

                let count = 0

                for (const postDoc of docSnap.docs) {
                    if (count >= 8) {
                        break
                    }

                    const likesRef = doc(db, "posts", postDoc.id, "likes", userid);
                    const likeDoc = await getDoc(likesRef)

                    if (likeDoc.exists()) {
                        const data = {
                            src: postDoc.data().picture,
                        }

                        this.images.push(data);
                        count++;
                    }
                }
            } catch (error) {
                console.log("Error getting favoriteImgs", error.code, error.message);
            }
        }
    },

    mounted() {
        this.getFavoriteImgs();
    },

     beforeDestroy() {
        this.unsubscribe();
     }

};

console.log("ImageGallery.js loaded successfully");
