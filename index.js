function getLearnerData(courseInfo, assignmentGroup, learnerSubmissions) {
  try {
    // Validate input data
    if (!courseInfo || !assignmentGroup || !learnerSubmissions) {
      throw new Error("Invalid input data");
    }

    // Check if assignment group belongs to the course
    if (assignmentGroup.course_id !== courseInfo.id) {
      throw new Error("Assignment group does not belong to the course");
    }

    // Filter out assignments that are not yet due
    const dueAssignments = assignmentGroup.assignments.filter((assignment) => {
      const dueDate = new Date(assignment.due_at);
      const today = new Date();
      return dueDate <= today;
    });

    // Calculate weighted average for each learner
    const learnerData = learnerSubmissions.reduce((acc, submission) => {
      const assignment = dueAssignments.find(
        (assignment) => assignment.id === submission.assignment_id
      );
      if (!assignment) {
        return acc;
      }

      const learnerId = submission.learner_id;
      const score = submission.submission.score;
      const pointsPossible = assignment.points_possible;
      const latePenalty =
        new Date(submission.submission.submitted_at) >
        new Date(assignment.due_at)
          ? 0.1 * pointsPossible
          : 0;
      const weightedScore = (score - latePenalty) / pointsPossible;

      const existingLearner = acc.find((learner) => learner.id === learnerId);
      if (existingLearner) {
        existingLearner.avg += weightedScore * assignment.group_weight;
        existingLearner[submission.assignment_id] = weightedScore * 100;
      } else {
        acc.push({
          id: learnerId,
          avg: weightedScore * assignment.group_weight,
          [submission.assignment_id]: weightedScore * 100,
        });
      }

      return acc;
    }, []);

    // Calculate overall weighted average for each learner
    learnerData.forEach((learner) => {
      learner.avg /= assignmentGroup.group_weight;
    });

    return learnerData;
  } catch (error) {
    console.error(error);
    return [];
  }
}
