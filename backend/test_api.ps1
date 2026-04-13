# Simple script to test the SpendWise API using httpie

$baseUrl = "http://localhost:5000/api"
$email = "testuser@example.com"
$password = "Password123!"

Write-Host "--- 1. Register ---"
http POST "$baseUrl/auth/register" email="$email" password="$password" first_name="Test" last_name="User"

Write-Host "`n--- 2. Login ---"
$loginRes = http POST "$baseUrl/auth/login" email="$email" password="$password" | ConvertFrom-Json
$token = $loginRes.access
Write-Host "Token received"

Write-Host "`n--- 3. Get Me ---"
http GET "$baseUrl/auth/me" "Authorization: Bearer $token"

Write-Host "`n--- 4. Create Transaction ---"
http POST "$baseUrl/transactions/" "Authorization: Bearer $token" type="expense" amount="50.00" category="Food" description="Lunch" date="2026-04-13"

Write-Host "`n--- 5. Get Transactions ---"
http GET "$baseUrl/transactions/" "Authorization: Bearer $token"

Write-Host "`n--- 6. Create Budget ---"
http POST "$baseUrl/budgets/" "Authorization: Bearer $token" category="Food" limit="500.00" period="monthly"

Write-Host "`n--- 7. Get Budgets ---"
http GET "$baseUrl/budgets/" "Authorization: Bearer $token"
