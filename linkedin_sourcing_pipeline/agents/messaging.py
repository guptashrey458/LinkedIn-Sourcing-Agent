def generate_outreach_message(candidate, job):
    return f"""Hi {candidate['name']}, I came across your profile and was impressed by your experience at {candidate['companies'][0]} and your skills in {', '.join(candidate['skills'][:3])}. We’re hiring for a {job['title']} role that matches your background. Let me know if you’d like to connect!"""
