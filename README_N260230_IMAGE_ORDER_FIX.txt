N260230 이미지 순서 수정 패치

적용 내용
- 첫번째 사진(N260230_01.jpg)을 맨 뒤로 이동
- 두번째 사진(N260230_02.jpg)을 메인컷으로 변경
- 세번째 사진(N260230_03.jpg)은 쇼룸 노출 목록에서 제거

변경 결과
- mainImage / thumbImage / thumbnail = assets/N260230_02.jpg
- images 순서:
  1. assets/N260230_02.jpg
  2. assets/N260230_04.jpg
  3. assets/N260230_05.jpg
  4. assets/N260230_06.jpg
  5. assets/N260230_01.jpg

적용 방법
1. ZIP 압축을 풉니다.
2. sunny2026ss 폴더의 products.json만 덮어쓰기 합니다.
3. GitHub Desktop에서 변경 파일이 products.json 1개만 보이면 정상입니다.
4. Commit 후 Push 합니다.
5. 쇼룸에서 Ctrl+F5로 강력 새로고침합니다.

참고
- asset 파일 자체를 삭제한 것은 아닙니다.
- N260230 상품의 쇼룸 노출 순서만 수정한 패치입니다.
