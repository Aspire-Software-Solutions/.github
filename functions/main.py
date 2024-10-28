from firebase_functions import https_fn, firestore_fn
import firebase_admin
from firebase_admin import firestore

# Initialize the Firebase Admin SDK
firebase_admin.initialize_app()

@https_fn.on_call()
def delete_conversation(req: https_fn.CallableRequest) -> dict:
    try:
        conversation_id = req.data.get('conversationId')
        user_id = req.auth.uid

        if not conversation_id or not req.auth:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="conversationId and authenticated user are required."
            )

        db = firestore.client()
        conversation_ref = db.collection('conversations').document(conversation_id)
        conversation_doc = conversation_ref.get()

        if not conversation_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Conversation not found."
            )

        # Remove user from the members array
        conversation_ref.update({
            "members": firestore.ArrayRemove([user_id])
        })

        # Check if there are any members left after update
        conversation_data = conversation_ref.get().to_dict()
        if not conversation_data.get('members'):
            # If no members, delete conversation and messages subcollection
            delete_collection(conversation_ref)  # Ensure delete_collection handles subcollections

        return {'success': True}
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"An error occurred: {str(e)}"
        )


def delete_collection(doc_ref):
    db = firestore.client()
    collections = doc_ref.collections()
    for collection in collections:
        delete_documents(collection)
    doc_ref.delete()

def delete_documents(collection_ref, batch_size=500):
    docs = collection_ref.limit(batch_size).stream()
    for doc in docs:
        delete_collection(doc.reference)
        doc.reference.delete()
    if len(list(docs)) >= batch_size:
        return delete_documents(collection_ref, batch_size)

@firestore_fn.on_document_written(document="conversations/{conversationId}")
def handle_empty_conversations(event) -> None:
    db = firestore.client()
    conversation_ref = db.collection('conversations').document(event.params["conversationId"])
    conversation_data = conversation_ref.get().to_dict()

    if conversation_data and not conversation_data.get("members"):
        delete_collection(conversation_ref)
