/**
 * Created by GrantBroadwater on 01/10/2018
 */

// Variables
var ref = firebase.database().ref();
var eventsRef = ref.child("events");
var usersRef = ref.child("users");

// Notifications
var EventDoesExist = "EventDoesExist";
var EventNameDidChange = "EventNameDidChange";
var EventLocationDidChange = "EventLocationDidChange";
var EventQueueDidChange = "EventQueueDidChange";
var EventActiveRidesDidChange = "EventActiveRidesDidChange";
var EventDisabledDidChange = "EventDisabledDidChange";

// Variables
var eventDoesExist = true;
var eventName = undefined;
var eventLocation = undefined;
var eventQueue = undefined;
var eventActiveRides = undefined;
var eventDisabled = false;

// Create Model
function createEventModel( eventID ) {
    eventsRef.child(eventID).on('value', eventValueListener);
    eventsRef.child(eventID).child("name").on('value', eventNameValueListener);
    eventsRef.child(eventID).child("location").on('value', eventLocationValueListener);
    eventsRef.child(eventID).child("disabled").on('value', eventDisabledValueListener);
    eventsRef.child(eventID).child("queue").on('value', eventQueueValueListener);
    eventsRef.child(eventID).child("activeRides").on('value', eventActiveRidesValueListener);
}


// Real time update functions
function eventValueListener( snap ) {
    eventDoesExist = !!snap.val();
    $.Topic( EventDoesExist ).publish(true);
}

function eventNameValueListener( snap ) {
    eventName = snap.val();
    $.Topic( EventNameDidChange ).publish( true );
}

function eventLocationValueListener( snap ) {
    eventLocation = snap.val();
    $.Topic( EventLocationDidChange ).publish( true )
}

function eventQueueValueListener( snap ) {
    eventQueue = snap.val();
    $.Topic( EventQueueDidChange ).publish( true )
}

function eventActiveRidesValueListener( snap ) {
    eventActiveRides = snap.val();
    $.Topic( EventActiveRidesDidChange ).publish( true )
}

function eventDisabledValueListener( snap ) {
    eventDisabled = !!snap.val();
    $.Topic( EventDisabledDidChange ).publish( true );
}

// Notifications
var UserDoesExist = "UserDoesExist";
var UserUIDDidChange = "UserUIDDidChange";
var UserDisplayNameDidChange = "userDisplayNameDidChange";
var UserRidesDidChange = "userRidesDidChange";
var UserSavedEventsDidChange = "userSavedEventsDidChange";

// Variables
var userDoesExist = true;
var userUID = undefined;
var userDisplayName = undefined;
var userFacebookID = undefined;
var userRides = undefined;
var userSavedEvents = undefined;

firebase.auth().onAuthStateChanged(function(user) {

    if( user ) {

        userDoesExist = true;
        $.Topic( UserDoesExist ).publish( true );
        userUID = user.uid;
        $.Topic( UserUIDDidChange ).publish( true );
        userDisplayName = user.displayName;

        user.providerData.forEach( function(profile) {

            console.log( "Provider: " + profile.providerId );
            console.log( "\tUID: " + profile.uid );

            if( profile.providerId.includes( "facebook.com" )) {
                userFacebookID = profile.uid;
            }

        } );

        $.Topic( UserDisplayNameDidChange ).publish( true );
        usersRef.child( user.uid ).on( "value", addUserIfTheyDoNotExist );
        usersRef.child( user.uid ).child( "rides" ).on("value", userRidesValueListener);
        usersRef.child( user.uid ).child( "savedEvents" ).on( "value", userSavedEventsValueListener );

    } else {

        userDoesExist = false;
        $.Topic( UserDoesExist ).publish( true );
        userUID = undefined;
        $.Topic( UserUIDDidChange ).publish( true );
        userDisplayName = undefined;
        $.Topic( UserDisplayNameDidChange ).publish( true );
        userRides = undefined;
        $.Topic( UserRidesDidChange ).publish( true );
        userSavedEvents = undefined;
        $.Topic( UserSavedEventsDidChange ).publish( true );
        userFacebookID = undefined;

    }

});

function userRidesValueListener( snap ) {
    userRides = snap.val();
    $.Topic( UserRidesDidChange ).publish( true );
}

function userSavedEventsValueListener( snap ) {
    userSavedEvents = snap.val();
    $.Topic( UserSavedEventsDidChange ).publish( true );
}

function addUserIfTheyDoNotExist( snap ) {

    var userDisplayName = snap.child( "displayName" ).val()

    var updates = {};

    updates[ "/users/" + userUID + "/displayName" ] = userDisplayName;
    updates[ "/users/" + userUID + "/facebookUID" ] = userFacebookID;

    ref.update( updates );

}