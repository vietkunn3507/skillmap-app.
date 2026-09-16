# Đối chiếu SkillMAP với Idea.docx

Đã đọc toàn bộ 13 module và 7 màn hình trong `C:/Users/Admin/Downloads/Idea.docx`. Không sửa tài liệu gốc. Bản cập nhật triển khai các công cụ có thể chạy từ dữ liệu hiện có; không khẳng định đã hoàn thiện tất cả mô hình nghiên cứu trong đề án.

## Những phần vừa bổ sung

| Công cụ | Địa chỉ | Hành vi thực tế |
|---|---|---|
| Kỹ năng tăng / giảm nhanh nhất | `/explore?tab=market`, `/organization`, `/intelligence` | Chọn hai năm và ngành; xếp hạng `change_pp`; thêm kỹ năng vào kế hoạch |
| Organization Intelligence | `/organization` | Nhu cầu nghề theo năm, seniority, địa điểm, đối chiếu danh sách kỹ năng chương trình đào tạo, xuất CSV, SGI/ILOSTAT trong biểu đồ chuyên sâu |
| Skill Investment Planner | `/investment` | Điểm ưu tiên giải thích được; thêm vào kế hoạch; mô phỏng nhiều kỹ năng và độ bao phủ trước/sau |
| Career Transition Explorer | `/transition` | Chọn hai nghề; Dijkstra trên đồ thị kỹ năng; các bước, kỹ năng cần bổ sung, đường thay thế khi có nghề trung gian |
| Skill–Occupation Explorer | `/intelligence` | Nghề → kỹ năng và kỹ năng → nghề, số tin chứng minh, ngưỡng mẫu |
| AI & Task Transformation | `/transformation` | Gemini phân loại nhiệm vụ nhập vào, giải thích, human review, kỹ năng đề xuất; có mẫu Tài chính và IT ghi rõ nguồn biên soạn |
| CV extraction | `/profile`, API `/api/cv/analyze` | Thêm trích nhiệm vụ/công cụ/ngôn ngữ bằng Gemini; chỉ chấp nhận mục có đoạn trích tồn tại trong CV; giữ hồ sơ để người dùng rà soát |
| Mapi retrieval | `/ai` | Thêm dataset `growth` để truy xuất xếp hạng toàn bộ kỹ năng tăng/giảm, vẫn kiểm tra nguồn và số liệu |

Các công cụ mới truy cập từ Khám phá và Bản đồ. Thanh điều hướng chính vẫn là Trang chủ / Khám phá / Bản đồ / AI / Hồ sơ.

## Phương pháp và giới hạn

**Tăng trưởng:** endpoint mới `/api/skills/growth` dùng bảng SQLite `skill_trend_yearly` hiện có, không tự tạo số liệu hoặc giả định đã đọc file CSV bên ngoài. `change_pp = share_pct(end) - share_pct(start)`. Dùng phép nối hai năm, chỉ đưa vào kỹ năng có cả hai quan sát. Mặc định 2023–2025; có thể chọn năm khác. Không chỉ lấy top 50 trước khi tính. Có 64 cặp IT/Data và 54 cặp Tài chính/Kế toán trước lọc taxonomy. Nhãn đồng nghĩa không được cộng tỷ trọng, tránh đếm lặp; bản đầu tiên theo thứ tự nguồn được giữ. 2026 chưa đủ năm.

**Đồ thị nghề:** endpoint `/api/intelligence/occupations` nhóm theo job_title gốc. Đây là tiêu đề tuyển dụng, chưa phải occupation ISCO chuẩn hóa. Nhãn skill qua bộ lọc taxonomy; bí danh kỹ năng được hợp các job_id để không đếm trùng. Mỗi nghề có số tin, kỹ năng quan sát và số tin theo năm. Có thể lọc tối thiểu 1, 2 hoặc 5 tin. Không có embedding trong phép tính này.

**Độ bao phủ:** tổng số lần xuất hiện kỹ năng đã có / tổng số lần xuất hiện kỹ năng hợp lệ trong mẫu nghề. Mỗi kỹ năng đếm số tin riêng. Độ bao phủ không đo mức thành thạo, học vấn, kinh nghiệm, chất lượng chương trình đào tạo hoặc xác suất trúng tuyển. Điểm demo 82/74/67 vẫn là dữ liệu demo riêng.

**Ưu tiên kỹ năng:** 40 điểm cho độ phổ biến tương đối, 30 điểm có ở nghề mục tiêu, 20 điểm tăng tỷ trọng dương, 10 điểm độ phủ các tiêu đề nghề. Chuẩn hóa trên tập đang xét; chỉ xếp kỹ năng chưa có. Không có chuỗi năm thì không ghi thay đổi bằng 0: UI hiển thị chưa có và không cộng điểm xu hướng. Trọng số sản phẩm chưa được kiểm định. Không tính ROI tiền bạc hoặc thời lượng học khi không có dữ liệu.

**Chuyển nghề:** Dijkstra, cạnh có Jaccard kỹ năng ≥ 0,15. Chi phí mỗi cạnh = (tỷ lệ kỹ năng mới ở nghề đích)² + 0,05. Vì thế có thể tìm nghề trung gian khi bằng chứng tạo được kết nối. Không buộc phải có nghề trung gian nếu đường trực tiếp tốt hơn. Đường thay thế được tìm bằng cách loại nghề trung gian đầu tiên. Chưa đánh giá rào cản thực tế về bằng cấp, seniority, task hoặc chi phí đào tạo.

**AI & nhiệm vụ:** đánh giá định tính do Gemini tạo cho các nhiệm vụ nhập vào hoặc mẫu có nhãn minh họa. Bốn nhóm: tự động hóa từng phần, AI hỗ trợ, con người phán đoán, chưa đủ thông tin. Không có điểm ILO, tỷ lệ thay thế hoặc dự báo mất việc. Link ILO chỉ là tài liệu tham khảo cách tiếp cận theo nhiệm vụ, không chứng thực phân loại của Gemini. Không dùng các kỹ năng mô hình đề xuất làm số liệu “mới nổi”.

## Toàn bộ 13 module: phần có và phần còn thiếu

| Module Idea | Trạng thái sau cập nhật | Còn thiếu để đạt đầy đủ mô tả nghiên cứu |
|---|---|---|
| 1. Labour Market Data Engine | Đọc và tổng hợp database thật, lọc trình bày, snapshot phục vụ app | Chưa có crawler/job scheduler, pipeline NLP tin thô, đánh giá precision/recall hoặc quản trị chất lượng nguồn |
| 2. Skill & Task Intelligence | Taxonomy, đồ thị nghề–kỹ năng quan sát được; task từ CV/nhập tay và AI gợi ý kỹ năng | Chưa có embedding, task–occupation đã được xác minh theo từng tin; chưa có tập ground truth |
| 3. Vietnam Labour Market Map | Overview, địa lý, nghề, kỹ năng, năm, xếp tăng/giảm, SGI, ILOSTAT | Mẫu giới hạn hai ngành, không đại diện toàn thị trường hoặc dữ liệu cập nhật tự động |
| 4. Personal Skill Profile | Tài khoản riêng, CV, skill/task/tool/language, nghề mục tiêu, kế hoạch; Gemini extraction | Chưa có bài đánh giá thành thạo, chuẩn hóa đầy đủ kinh nghiệm/education/seniority thành thước đo |
| 5. Career Matching | Truy vấn kỹ năng hiện có và độ bao phủ có trọng số ở các công cụ mới | Chưa có mô hình đa yếu tố được kiểm định, semantic/task similarity hoặc điểm tương thích bằng cấp |
| 6. Skill Gap Analysis | Đã có / chưa có theo nghề và số tin, thứ tự ưu tiên, demo tách riêng | Chưa đo gap năng lực thực tế hoặc liên hệ task đã xác minh |
| 7. Skill Priority & ROI | Planner hoạt động, công thức và thành phần được công khai | Chưa có dữ liệu học phí, thời lượng, lợi ích thu nhập để tính ROI kinh tế |
| 8. Career Transition | Bản thuật toán tối giản hoạt động, có nghề trung gian khi phù hợp | Chưa mô hình hóa task, bằng cấp, seniority và tính khả thi thực tế; chưa có đánh giá ngoài mẫu |
| 9. What-if | Mô phỏng nhiều kỹ năng, tính lại coverage/gap và số tiêu đề đạt ngưỡng | Chưa mô phỏng thay đổi toàn bộ career pathways theo nhiều ràng buộc hoặc dự đoán kết quả học |
| 10. Job Explorer | Tin thực tế, kỹ năng, kinh nghiệm, địa điểm, ngành, lương khi có, link nguồn | Mẫu lịch sử có thể hết hạn; không có pipeline cập nhật tuyển dụng liên tục |
| 11. Organization Dashboard | Route riêng, curriculum comparison, xuất CSV, nhu cầu nghề/kỹ năng/địa phương, workforce charts | Chưa có tenant tổ chức, vai trò quản trị, upload chương trình học có cấu trúc hoặc khảo sát năng lực sinh viên |
| 12. AI Assistant | Gemini thật, lựa chọn dữ liệu, truy xuất, nguồn và kiểm tra số liệu; thêm growth | Kiểm tra số liệu không đảm bảo mọi diễn giải nhân quả đúng; cần bộ đánh giá câu trả lời dài hạn |
| 13. AI Task Transformation | Bản phân tích định tính nhiệm vụ dùng Gemini, có kết quả và lý do | Chưa có chỉ số exposure chuẩn hóa, chuyên gia chấm nhãn, chuỗi task composition theo năm hoặc đo AI adoption |

Những khoảng trống này không thể được giải quyết trung thực bằng cách thêm card hoặc số giả lên UI. Cần dữ liệu tin thô có nhiệm vụ/học vấn/kinh nghiệm, taxonomy nghề có mã chuẩn, nhãn chuyên gia, nguồn cập nhật và dữ liệu học tập/chi phí. Bản này bổ sung các luồng sản phẩm và thuật toán tối giản chạy được, đồng thời giữ rõ ranh giới với hệ thống nghiên cứu đầy đủ.

## Kiểm tra

- Next production build và TypeScript qua.
- 29 unit tests ban đầu qua; 2 tests mới của CV evidence parser qua (31 tổng cộng theo từng lượt).
- So sánh endpoint growth với SQL cho cả hai ngành: đủ cặp quan sát, `change_pp` khớp từng hàng.
- Browser thực: bảng tăng/giảm, CSV đào tạo, what-if, đường chuyển nghề, route explorer. Kiểm tra thêm trên database thật tìm được đường 3 nút có nghề trung gian; đây là kết nối theo kỹ năng, không xác nhận tiến triển seniority.
- Gemini thực: 5 nhiệm vụ mẫu trả đúng 5 mục; CV giả lập trích được task/tool/language có bằng chứng, không sửa tài khoản để kiểm thử.
- Giao diện tổ chức kiểm tra ở chiều rộng 390px không tràn ngang trang.
- Database gốc không bị sửa; ZIP triển khai được cập nhật và không chứa .env hay database tài khoản trên máy.

Nguồn phương pháp tham khảo: [ILO — Generative AI and jobs: A 2025 update](https://www.ilo.org/publications/generative-ai-and-jobs-2025-update). Các công thức sản phẩm ở trên do SkillMAP định nghĩa, không phải công thức ILO.
