# Tan Phat & Hong Ngoc - Wedding Invitation Website (v15)

## Moi nhat trong ban v15
- Da them thu muc `image/` de ban bo anh vao voi ten tu `1` den `10`.
- Website tu dong nhan cac anh `image/1..10` voi cac duoi: `jpg`, `jpeg`, `png`, `webp`.
- Da them section **cuon chieu / thu quyen anh** phong cach co trang Trung Hoa de show 10 anh nhu mot truong quyen dien anh co phong.
- Story va Gallery cung tu dong uu tien lay anh tu thu muc `image/`.
- Neu thieu anh, website se tu fallback ve `assets/images/couple-main.png`.
- Da bo sung hieu ung **rung nhe / lung linh / chuyen dong** cho rong, phuong, long ma va thien ma o hai ben.
- Fix lai bug JS gay loi cho mo rem.

## Cach bo anh
Bo anh vao thu muc:
- `image/1.jpg`
- `image/2.jpg`
- ...
- `image/10.jpg`

Hoac co the la:
- `image/1.png`
- `image/2.webp`
- `image/3.jpeg`

Khong can dong bo cung mot duoi file. Website se tu tim file phu hop.

## Ghi chu
- Story section uu tien anh 1 -> 4
- Gallery section uu tien anh 5 -> 8
- Cuon chieu anh su dung toan bo anh 1 -> 10
- Neu ban muon dep nhat, nen dung anh cung ti le va chat luong tot

## Cach dung
1. Giai nen file zip.
2. Them nhac vao `assets/music/wedding-song.mp3`.
3. Them anh vao thu muc `image/`.
4. Mo `index.html` de chay local hoac deploy online.
