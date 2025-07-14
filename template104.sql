UPDATE email_templates SET html_template = $$SET html_template = $$

<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <link href="https://fonts.googleapis.com/css?family=Fira+Sans:ital,wght@0,400;0,500;0,700" rel="stylesheet" />
  <title>{headline}</title>
</head>
<body style="font-family: 'Fira Sans', sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
  <img src="https://cloudfilesdm.com/postcards/Motion_Falcon_Logo_Set-02-0c9c3be2.png" width="100" alt="Logo" />
  <h1>{headline}</h1>
  <h2 style="color: #64ffda;">{subheadline}</h2>
  <p>{content}</p>
  <a href="{cta_link}" style="display: inline-block; padding: 12px 24px; background: #1595e7; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">{cta_text}</a>
</body>
</html>

$$
WHERE id = 103; $$ WHERE id = 104;
