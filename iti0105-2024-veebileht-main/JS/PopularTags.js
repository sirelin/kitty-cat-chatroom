import { db } from "../Firebase/firebase.js";
import { query, collection, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export const EventBus = new EventTarget();

export const PopularTags = {
    template: `
    <div>
        <button v-if="isMobile && !tagsVisible" 
                @click="toggleTags" 
                class="popular-tags-toggle-button">
            ☰
        </button>
      
        <div v-if="tagsVisible" 
            :class="['container', { 'popular-tags-modal': isMobile }]">
            <button v-if="isMobile" class="close-button" @click="closeTags">✕</button>
            
            <div class="newest-recent-box">
                <button class="newest-button" @click="onNewestClick">
                    <img src="../Elements/newest.svg" alt="Newest Icon" class="newest-icon"/>
                    <div class="new-tag-name">Newest and Recent</div>
                    <div class="new-tag-info">Find the latest update</div>
                </button>
                <button class="popular-button" @click="onPopularClick">
                    <img src="../Elements/popular.svg" alt="Popular Icon" class="popular-icon"/>
                    <div class="new-tag-name">Popular of the day</div>
                    <div class="new-tag-info">Shots featured today by curators</div>
                </button>
                <button class="newest-button" @click="onFollowingClick">
                    <img src="../Elements/following.svg" alt="Following Icon" class="following-icon"/>
                    <div class="new-tag-name">Following</div>
                    <div class="new-tag-info">Explore from your favourite person</div>
                </button>
            </div>
        
            <div class="popular-tags">
                <h2>Popular Tags</h2>
                    <ul>
                        <li v-for="tag in tags" :key="tag.id" class="tag-item">
                            <div class="tag-name" @click="onTagClick(tag)">#{{ tag.name }}</div>
                            <div class="tag-info">
                                <span class="tag-count">{{ tag.count }} Posted by this tag</span>
                                
                            </div>
                        </li>
                    </ul>
            </div>
            
            <div class="pinned-group-box">
                <h2>Pinned Group →</h2>
                <ul>
                    <li class="tag-item">
                        <div class="tag-name">#everyday - </div>
                        <div class="tag-info"> 82,645 Posted</div>
                    </li>
                        
                    <li class="tag-item">
                        <div class="tag-name">#catnip -</div>
                        <div class="tag-info"> 65,823 Posted • Trending</div>
                    </li>
                        
                    <li class="tag-item">
                        <div class="tag-name">#kittens - </div>
                        <div class="tag-info"> 51,354 • Trending</div>
                    </li>
                        
                    <li class="tag-item">
                        <div class="tag-name">#catart - </div>
                        <div class="tag-info"> 48,029 Posted</div>
                    </li>
                        
                    <li class="tag-item">
                        <div class="tag-name">#catpics - </div>
                        <div class="tag-info"> 51,354 • Trending</div>
                    </li>
                        
                </ul>
            </div>    
        </div>
      
        <div v-if="tagsVisible && isMobile" 
           class="popular-tags-overlay show" 
           @click="closeTags">
        </div>
    </div>
    `,

    data() {
        return {
            tags: [],
            tagsVisible: true,
            isMobile: window.innerWidth < 1320
        };
    },

    methods: {
        onNewestClick() {
            console.log("Newest and Recent clicked");
            const event = new CustomEvent('sort-post', { detail: {option: 'recent'} });
            EventBus.dispatchEvent(event);
        },

        onPopularClick() {
            console.log("Popular of the Day clicked");
            const event = new CustomEvent('sort-post', { detail: {option: 'popular'} });
            EventBus.dispatchEvent(event);
        },

        onFollowingClick() {
            console.log("Following clicked");
            const event = new CustomEvent('sort-post', { detail: {option: 'following'} });
            EventBus.dispatchEvent(event);
        },


        onTagClick(tag) {
            console.log("Tag clicked:", tag.name);
            const event = new CustomEvent('sort-post', { detail: {option: 'tag', tag: tag.name} });
            EventBus.dispatchEvent(event);
        },

        toggleTags() {
            this.tagsVisible = !this.tagsVisible;
        },

        closeTags() {
            this.tagsVisible = false;
        },

        checkScreenSize() {
            const clientWidth = document.documentElement.clientWidth;
            const clientHeight = document.documentElement.clientHeight;

            this.isMobile = clientWidth < 1320;
            if (!this.isMobile) {
              this.tagsVisible = true;
            } else {
              this.tagsVisible = false;
            }
        }
    },

    mounted() {
        this.checkScreenSize();
        window.addEventListener('resize', this.checkScreenSize);
        try {
            const dataQuery = query(
                collection(db, "tags"),
                orderBy("postCount", "desc"),
                limit(6)
            );

            const unsubscribe = onSnapshot(dataQuery, (querySnapshot) => {
                this.tags = querySnapshot.docs.map((doc) => {
                    return {
                        name: doc.id,
                        count: doc.data().postCount
                    };
                });
            });

            console.log("Everything")
        } catch (error) {
            console.log("Error querying tag data:", error.code, error.message);
        }
    },

    beforeDestroy() {
    window.removeEventListener('resize', this.checkScreenSize);
    this.unsubscribe();
    }
};
