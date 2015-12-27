tasks = new Mongo.Collection('tasks');

if (Meteor.isClient) {
    Meteor.subscribe('tasks');
    Template.main.helpers({
        tasks: tasks.find({}, {sort: {createdAt: -1}}),
        numberOfTasks: function () {
            return tasks.find(
                {
                    $or: [
                        {checked: {$exists: false}},
                        {checked: false}
                    ]
                }
            ).count()
        }
    });
    Template.main.events({
        'submit #new-todo-form': function (event) {
            var taskName = event.target.taskName.value;
            Meteor.call('addTask', taskName);

            // clear the form
            event.target.taskName.value = '';
            // prevent the form from submitting
            return false;
        },
        // toggle checked todo
        'click .toggle-checked': function () {
            Meteor.call('toggleChecked', this._id, this.checked, this.userId)
        },
        // delete todo
        'click .delete-task': function () {
            if (confirm('are you sure?')) {
                Meteor.call('deleteTask', this._id, this.userId)
            }
        }
    });
    Accounts.ui.config(
        {
            requestPermissions: {
                facebook: ['user_likes'],
                github: ['user', 'repo']
            },
            requestOfflineToken: {
                google: true
            },
            passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
        }
    );
}

if (Meteor.isServer) {
    Meteor.publish('tasks', function () {
        var todos = tasks.find(
            {
                $and: [
                    {userId: this.userId},
                    {userId: {$ne: null} }
                ]
            }
        );
        return todos;
    });
    Meteor.startup(function () {
        // code to run on server at startup
    });
}

Meteor.methods(
    {
        addTask: function (taskName) {
            if (Meteor.userId()) {
                // -1 add new todo
                tasks.insert(
                    {
                        name: taskName,
                        createdAt: new Date(),
                        userId: Meteor.userId(),
                        userName: Meteor.user().username
                    }
                );
            } else {
                throw new Meteor.Error('You need to login to be able to add a new task')
            }
        },
        deleteTask: function (taskId, userId) {
            if (Meteor.userId() && Meteor.userId() === userId) {
                tasks.remove(taskId)
            } else {
                throw new Meteor.Error('You need to login to delete a task')
            }

        },
        toggleChecked: function (taskId, isChecked, userId) {
            if (Meteor.userId() && Meteor.userId() === userId) {
                tasks.update(taskId, {$set: {checked: !isChecked}})
            } else {
                throw new Meteor.Error('Please login to do this action');
            }

        }
    }
);