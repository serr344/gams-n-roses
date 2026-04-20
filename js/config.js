export const CONFIG = {
    GRID_SIZE: 4800,
    ASSET_PATH: "./assets/",
    BUILDING_TYPES: [
        // --- MERKEZİ PARK (tek, sabit öncelikli) ---
        { type: "Merkezi Park",            w: 800, h: 800, db: 0,  color: "#eeff00", maxCount: 1,  minDist: 9999, imgIcon: "park.png" },
        { type: "Belediye Binası",         w: 150, h: 109, db: 55, color: "#005ce6", maxCount: 2,  minDist: 600, imgIcon: "government.png" },
        { type: "Hükümet Binası",          w: 150, h: 109, db: 55, color: "#003380", maxCount: 2,  minDist: 600, imgIcon: "government.png" },
        { type: "Adliye",                  w: 190, h: 160, db: 55, color: "#003380", maxCount: 2,  minDist: 600, imgIcon: "government.png" },
        { type: "Üniversite Kampüsü",      w: 384, h: 247, db: 60, color: "#9933ff", maxCount: 3,  minDist: 700, imgIcon: "university.png" },
        { type: "AVM (Alışveriş Merkezi)", w: 150, h: 71, db: 70, color: "#ff3399", maxCount: 4,  minDist: 500, imgIcon: "mall.png" },
        { type: "Devlet Hastanesi",        w: 280, h: 161, db: 40, color: "#ff1a1a", maxCount: 4,  minDist: 400, imgIcon: "hospital.png" },
        { type: "İtfaiye",                    w: 280, h: 169, db: 40, color: "#ff1a1a", maxCount: 5,  minDist: 400, imgIcon: "fire.png" },
        { type: "Polis Merkezi",                  w: 280, h: 182, db: 40, color: "#ff1a1a", maxCount: 5,  minDist: 400, imgIcon: "police.png" },
        { type: "Büyük Park",              w: 380, h: 256, db: 0, color: "#3a8a2a", maxCount: 10,  minDist: 400, imgIcon: "park.png" },
        { type: "Küçük Park",              w: 240, h: 128, db: 0, color: "#4a9a3a", maxCount: 18, minDist: 200, imgIcon: "park.png" },
        { type: "Meydan / Çimen Alan",     w: 150, h: 128, db: 0, color: "#3a7a2a", maxCount: 12, minDist: 250, imgIcon: "cimen.png" },
        { type: "boşluk",                  w: 10,  h: 10,  db: 0, color: "#3a7a2a", maxCount: Infinity, minDist: 0, imgIcon: "cimen.png" },

        { type: "İlkokul",                 w: 124, h: 74, db: 50, color: "#ff9933", maxCount: 7,  minDist: 200, imgIcon: "ilkokul.png" },
        { type: "Lise",                    w: 256, h: 192, db: 45, color: "#cc6600", maxCount: 6,  minDist: 250, imgIcon: "school.png" },
        { type: "Kütüphane",               w: 150, h: 132, db: 35, color: "#3399ff", maxCount: 7,  minDist: 200, imgIcon: "library.png" },
        { type: "Öğrenci Yurdu",           w: 128, h: 192, db: 45, color: "#66ccff", maxCount: 8,  minDist: 150, imgIcon: "residence.png" },
        { type: "Yaşlı Bakımevi",          w: 160, h: 119, db: 40, color: "#ff6666", maxCount: 10,  minDist: 250, imgIcon: "elderly.png" },
        { type: "Rezidans (Gökdelen)",     w: 120,  h: 83,  db: 50, color: "#00e6e6", maxCount: 40, minDist: 80,  imgIcon: "residence.png" },
        { type: "Otopark",                 w: 180,  h: 110,  db: 70, color: "#737373", maxCount: 12, minDist: 80,  imgIcon: "otopark.png" },
        { type: "Ofis Binası",             w: 100,  h: 84,  db: 55, color: "#ffcc00", maxCount: 40, minDist: 60,  imgIcon: "office.png" },

        { type: "Apartman (Konut)", w: 60, h: 43, db: 50, color: "#8cd98c", maxCount: Infinity, minDist: 0, prob: 0.40, isFiller: false, imgIcon: "house.png" },
        { type: "Müstakil Ev",      w: 120, h: 83, db: 45, color: "#b3ffcc", maxCount: Infinity, minDist: 0, prob: 0.30, isFiller: true, imgIcon: "house.png" },
        { type: "Çeşitli Mağazalar",w: 60, h: 36, db: 65, color: "#ffff66", maxCount: Infinity, minDist: 0, prob: 0.15, isFiller: true, imgIcon: "shop.png" },
        { type: "Kafe",  w: 60, h: 36, db: 60, color: "#ff99cc", maxCount: Infinity, minDist: 0, prob: 0.15, isFiller: true, imgIcon: "cafe.png" },
        { type: "Restoran",  w: 90, h: 54, db: 60, color: "#ff99cc", maxCount: Infinity, minDist: 0, prob: 0.15, isFiller: true, imgIcon: "restaurant.png" }
    ]
};